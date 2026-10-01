"""In-memory event bus for ResilienceOS WebSocket updates."""

import asyncio
import logging
from collections import defaultdict
from typing import Any

logger = logging.getLogger(__name__)


class EventBus:
    """Publish events to subscribers by logical channel."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
        self._main_loop = None

    def subscribe(self, channel: str) -> asyncio.Queue:
        """Subscribe a client to a logical channel."""
        try:
            self._main_loop = asyncio.get_running_loop()
        except RuntimeError:
            pass
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[channel].add(queue)

        logger.info(
            "Event subscriber connected | channel=%s | total=%d",
            channel,
            len(self._subscribers[channel]),
        )

        return queue

    def unsubscribe(
        self,
        channel: str,
        queue: asyncio.Queue,
    ) -> None:
        """Remove a client subscription."""
        self._subscribers[channel].discard(queue)

        logger.info(
            "Event subscriber disconnected | channel=%s | total=%d",
            channel,
            len(self._subscribers[channel]),
        )

    async def publish(
        self,
        channel: str,
        event: dict[str, Any],
    ) -> None:
        """Publish an event asynchronously to channel subscribers."""
        for queue in list(self._subscribers[channel]):
            await queue.put(event)

        evt_type = event.get("type", "unknown")
        if evt_type == "telemetry_tick":
            logger.debug(
                "Event published | channel=%s | event_type=%s | subscribers=%d",
                channel,
                evt_type,
                len(self._subscribers[channel]),
            )
        else:
            logger.info(
                "Event published | channel=%s | event_type=%s | subscribers=%d",
                channel,
                evt_type,
                len(self._subscribers[channel]),
            )

    def publish_nowait(
        self,
        channel: str,
        event: dict[str, Any],
    ) -> None:
        """Publish an event synchronously without awaiting subscribers."""
        if not self._subscribers[channel]:
            return

        def _put():
            for queue in list(self._subscribers[channel]):
                queue.put_nowait(event)
            evt_type = event.get("type", "unknown")
            if evt_type == "telemetry_tick":
                logger.debug(
                    "Event published | channel=%s | event_type=%s | subscribers=%d",
                    channel,
                    evt_type,
                    len(self._subscribers[channel]),
                )
            else:
                logger.info(
                    "Event published | channel=%s | event_type=%s | subscribers=%d",
                    channel,
                    evt_type,
                    len(self._subscribers[channel]),
                )

        try:
            current_loop = asyncio.get_running_loop()
            if self._main_loop and current_loop is not self._main_loop:
                self._main_loop.call_soon_threadsafe(_put)
            else:
                _put()
        except RuntimeError:
            if self._main_loop:
                self._main_loop.call_soon_threadsafe(_put)
            else:
                _put()


event_bus = EventBus()
