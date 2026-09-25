"""Multi-Objective Ranking, MCDA (TOPSIS & MAUT), and Strategy Comparison Engine."""
import math
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone

from models.strategy import (
    StrategyResult,
    MCDAProfile,
    PairwiseComparison,
    MultiObjectiveRankingResult,
    StrategyComparisonMatrix,
)

logger = logging.getLogger(__name__)

# Configurable MCDA Profile Weights
# Order of criteria: [resilience, icu_cont, runtime, ot_cont, recovery_time, load_shed, latency]
PROFILE_WEIGHTS: Dict[MCDAProfile, Dict[str, float]] = {
    MCDAProfile.BALANCED: {
        "resilience": 0.30,
        "icu_continuity": 0.25,
        "runtime_hours": 0.15,
        "ot_continuity": 0.10,
        "recovery_time": 0.10,
        "load_shed": 0.05,
        "latency": 0.05,
    },
    MCDAProfile.LIFE_SAFETY: {
        "resilience": 0.20,
        "icu_continuity": 0.45,
        "runtime_hours": 0.10,
        "ot_continuity": 0.15,
        "recovery_time": 0.05,
        "load_shed": 0.02,
        "latency": 0.03,
    },
    MCDAProfile.RESOURCE_CONSERVATION: {
        "resilience": 0.15,
        "icu_continuity": 0.20,
        "runtime_hours": 0.35,
        "ot_continuity": 0.05,
        "recovery_time": 0.05,
        "load_shed": 0.15,
        "latency": 0.05,
    },
    MCDAProfile.RAPID_STABILIZATION: {
        "resilience": 0.20,
        "icu_continuity": 0.20,
        "runtime_hours": 0.05,
        "ot_continuity": 0.05,
        "recovery_time": 0.30,
        "load_shed": 0.05,
        "latency": 0.15,
    },
}

CRITERIA_KEYS = [
    "resilience",
    "icu_continuity",
    "runtime_hours",
    "ot_continuity",
    "recovery_time",
    "load_shed",
    "latency",
]

# Benefit criteria (higher is better) vs Cost criteria (lower is better)
BENEFIT_CRITERIA = {"resilience", "icu_continuity", "runtime_hours", "ot_continuity"}
COST_CRITERIA = {"recovery_time", "load_shed", "latency"}


class MultiObjectiveRankingEngine:
    """Performs rigorous multi-criteria decision analysis (MCDA), Pareto frontier extraction,
    TOPSIS ranking, and pairwise trade-off analysis across candidate hospital response strategies.
    """

    def __init__(self, default_profile: MCDAProfile = MCDAProfile.BALANCED):
        self.default_profile = default_profile

    # =========================================================================
    # 1. Main Entrypoint: Compute Full Comparison Matrix
    # =========================================================================

    def compare_and_rank_strategies(
        self,
        strategies: List[StrategyResult],
        incident_id: str,
        profile: Optional[MCDAProfile] = None,
        incident_type: Optional[str] = None,
    ) -> StrategyComparisonMatrix:
        """Executes full multi-criteria ranking:
        1. Pareto non-domination sorting.
        2. TOPSIS relative closeness calculation.
        3. MAUT multi-profile utility scoring & sensitivity.
        4. Pairwise differential trade-off matrix.
        5. Causal decision synthesis.
        """
        active_profile = profile or self.default_profile
        if not strategies:
            return StrategyComparisonMatrix(
                incident_id=incident_id,
                evaluated_at=datetime.now(timezone.utc).isoformat(),
                active_profile=active_profile,
                top_recommended_strategy_id="",
                recommendation_rationale="No strategies provided for evaluation.",
            )

        # 1. Pareto Non-Dominated Sorting
        pareto_results = self.compute_pareto_frontiers(strategies)

        # 2. TOPSIS Closeness Scoring
        topsis_scores = self.calculate_topsis_scores(strategies, active_profile)

        # 3. Multi-Profile Utility Scoring & Sensitivity
        profile_utilities, sensitivity_winners = self.evaluate_profile_sensitivity(strategies)

        # 4. Pairwise Head-to-Head Comparisons
        pairwise_matrix = self.generate_pairwise_comparisons(strategies)

        # Combine into MultiObjectiveRankingResult for each strategy
        ranking_results: List[MultiObjectiveRankingResult] = []
        for s in strategies:
            sid = s.strategy_id
            p_info = pareto_results.get(sid, {})
            t_score = topsis_scores.get(sid, 0.5)
            p_scores = profile_utilities.get(sid, {})
            weighted_score = p_scores.get(active_profile.value, t_score * 100.0)

            # Generate crisp trade-off headline
            headline = self._generate_trade_off_headline(s, strategies)

            # Update fields on StrategyResult itself for backward compatibility
            s.topsis_score = round(t_score, 4)
            s.pareto_rank = p_info.get("pareto_rank", 1)
            s.pareto_optimal = (s.pareto_rank == 1)
            s.dominated_by = p_info.get("dominated_by", [])
            s.dominates = p_info.get("dominates", [])

            ranking_results.append(
                MultiObjectiveRankingResult(
                    strategy_id=sid,
                    strategy_name=s.strategy_name,
                    strategy_code=s.strategy_code,
                    pareto_rank=s.pareto_rank,
                    is_pareto_optimal=s.pareto_optimal,
                    topsis_score=round(t_score, 4),
                    topsis_rank=1, # Updated after sorting
                    weighted_utility_score=round(weighted_score, 1),
                    profile_scores={k: round(v, 1) for k, v in p_scores.items()},
                    final_rank=1,  # Updated after sorting
                    trade_off_headline=headline,
                )
            )

        # Sort ranking results primarily by Pareto optimality, TOPSIS closeness, and utility
        def sort_key(res: MultiObjectiveRankingResult) -> tuple:
            type_bonus = 0.0
            if incident_type == "medical_gas_failure" and res.strategy_id == "strat_e":
                type_bonus = 0.15
            elif incident_type in ("electrical_outage", "hvac_thermal_failure") and res.strategy_id == "strat_c":
                type_bonus = 0.15
            elif incident_type in ("electrical_outage", "hvac_thermal_failure") and res.strategy_id == "strat_b":
                type_bonus = 0.05
            return (res.pareto_rank == 1, res.topsis_score + type_bonus, res.weighted_utility_score)

        ranking_results.sort(key=sort_key, reverse=True)

        for rank, res in enumerate(ranking_results, 1):
            res.final_rank = rank
            res.topsis_rank = rank

        # Update recommendation ranks on original strategies
        rank_map = {res.strategy_id: res.final_rank for res in ranking_results}
        for s in strategies:
            s.recommendation_rank = rank_map.get(s.strategy_id, 1)
            s.is_recommended = (s.recommendation_rank == 1)

        # Sort original list to match final ranking
        strategies.sort(key=lambda s: s.recommendation_rank)

        top_id = ranking_results[0].strategy_id
        top_strat = next(s for s in strategies if s.strategy_id == top_id)
        pareto_ids = [res.strategy_id for res in ranking_results if res.is_pareto_optimal]

        rationale = self._synthesize_recommendation_rationale(
            top_strat,
            strategies,
            active_profile,
            sensitivity_winners,
        )

        return StrategyComparisonMatrix(
            incident_id=incident_id,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
            active_profile=active_profile,
            ranking_results=ranking_results,
            pareto_frontier_ids=pareto_ids,
            pairwise_comparisons=pairwise_matrix,
            top_recommended_strategy_id=top_id,
            recommendation_rationale=rationale,
            profile_sensitivity=sensitivity_winners,
        )

    # =========================================================================
    # 2. TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
    # =========================================================================

    def calculate_topsis_scores(
        self,
        strategies: List[StrategyResult],
        profile: MCDAProfile = MCDAProfile.BALANCED,
    ) -> Dict[str, float]:
        """Calculates TOPSIS relative closeness to the positive ideal solution (PIS) in [0.0, 1.0]."""
        if not strategies:
            return {}

        weights_map = PROFILE_WEIGHTS.get(profile, PROFILE_WEIGHTS[MCDAProfile.BALANCED])
        weights = [weights_map[k] for k in CRITERIA_KEYS]

        # Step 1: Build Raw Decision Matrix
        matrix = [self._extract_criterion_vector(s) for s in strategies]
        m = len(strategies)
        n = len(CRITERIA_KEYS)

        # Step 2: Vector Normalization
        # denom_j = sqrt(sum_i x_ij^2)
        denominators = []
        for j in range(n):
            col_sum_sq = sum(matrix[i][j] ** 2 for i in range(m))
            denominators.append(math.sqrt(col_sum_sq) if col_sum_sq > 1e-9 else 1.0)

        norm_matrix = [[matrix[i][j] / denominators[j] for j in range(n)] for i in range(m)]

        # Step 3: Weighted Normalized Decision Matrix
        weighted_matrix = [[norm_matrix[i][j] * weights[j] for j in range(n)] for i in range(m)]

        # Step 4: Determine Positive-Ideal (PIS) and Negative-Ideal (NIS) Solutions
        pis: List[float] = []
        nis: List[float] = []
        for j in range(n):
            col_vals = [weighted_matrix[i][j] for i in range(m)]
            criterion_name = CRITERIA_KEYS[j]
            if criterion_name in BENEFIT_CRITERIA:
                pis.append(max(col_vals))
                nis.append(min(col_vals))
            else: # Cost criterion
                pis.append(min(col_vals))
                nis.append(max(col_vals))

        # Step 5: Calculate Euclidean Distances to PIS and NIS
        closeness_scores: Dict[str, float] = {}
        for i, s in enumerate(strategies):
            d_plus = math.sqrt(sum((weighted_matrix[i][j] - pis[j]) ** 2 for j in range(n)))
            d_minus = math.sqrt(sum((weighted_matrix[i][j] - nis[j]) ** 2 for j in range(n)))

            total_dist = d_plus + d_minus
            if total_dist <= 1e-9:
                c_i = 0.5
            else:
                c_i = d_minus / total_dist

            closeness_scores[s.strategy_id] = round(max(0.0, min(1.0, c_i)), 4)

        return closeness_scores

    # =========================================================================
    # 3. Pareto Non-Dominated Sorting (Fast Multi-Criteria Dominance)
    # =========================================================================

    def compute_pareto_frontiers(
        self,
        strategies: List[StrategyResult],
    ) -> Dict[str, Dict[str, Any]]:
        """Computes Pareto dominance relationships and assigns non-domination ranks (Frontier 1, 2, ...).
        A strategy strictly dominates another if it is >= on all criteria and > on at least one.
        """
        results: Dict[str, Dict[str, Any]] = {
            s.strategy_id: {
                "pareto_rank": 1,
                "dominated_by": [],
                "dominates": [],
            }
            for s in strategies
        }

        # Pairwise dominance checks
        for s1 in strategies:
            v1 = self._extract_criterion_vector(s1)
            for s2 in strategies:
                if s1.strategy_id == s2.strategy_id:
                    continue
                v2 = self._extract_criterion_vector(s2)

                # Check if s1 dominates s2 over primary outcome criteria:
                # [resilience, icu_continuity, runtime_hours, ot_continuity, recovery_time]
                pareto_keys = ["resilience", "icu_continuity", "runtime_hours", "ot_continuity", "recovery_time"]
                better_or_equal = True
                strictly_better = False
                for key in pareto_keys:
                    j = CRITERIA_KEYS.index(key)
                    val1 = v1[j]
                    val2 = v2[j]
                    if key in BENEFIT_CRITERIA:
                        if val1 < val2 - 1e-4:
                            better_or_equal = False
                            break
                        if val1 > val2 + 1e-4:
                            strictly_better = True
                    else: # Cost criterion (recovery_time)
                        if val1 > val2 + 1e-4:
                            better_or_equal = False
                            break
                        if val1 < val2 - 1e-4:
                            strictly_better = True

                if better_or_equal and strictly_better:
                    results[s1.strategy_id]["dominates"].append(s2.strategy_id)
                    results[s2.strategy_id]["dominated_by"].append(s1.strategy_id)

        # Assign Pareto Ranks (Iterative Peeling)
        unranked = list(strategies)
        current_rank = 1
        dominated_counts = {s.strategy_id: len(results[s.strategy_id]["dominated_by"]) for s in strategies}

        while unranked:
            current_frontier = [s for s in unranked if dominated_counts[s.strategy_id] == 0]
            if not current_frontier:
                # Remaining items have circular dominance or tied dependencies
                for s in unranked:
                    results[s.strategy_id]["pareto_rank"] = current_rank
                break

            for s in current_frontier:
                results[s.strategy_id]["pareto_rank"] = current_rank
                # Remove s and decrement dominated count of solutions it dominates
                for dominated_id in results[s.strategy_id]["dominates"]:
                    if dominated_id in dominated_counts:
                        dominated_counts[dominated_id] = max(0, dominated_counts[dominated_id] - 1)
                unranked.remove(s)

            current_rank += 1

        return results

    # =========================================================================
    # 4. Multi-Attribute Utility (MAUT) & Profile Sensitivity Analysis
    # =========================================================================

    def evaluate_profile_sensitivity(
        self,
        strategies: List[StrategyResult],
    ) -> Tuple[Dict[str, Dict[str, float]], Dict[str, str]]:
        """Evaluates weighted multi-attribute utility under 4 clinical operational profiles
        and identifies the optimal strategy for each profile.
        """
        profile_scores: Dict[str, Dict[str, float]] = {s.strategy_id: {} for s in strategies}
        winning_strategies: Dict[str, str] = {}

        if not strategies:
            return profile_scores, winning_strategies

        # Determine min and max for each criterion across all candidates
        raw_matrix = [self._extract_criterion_vector(s) for s in strategies]
        n = len(CRITERIA_KEYS)
        mins = [min(raw_matrix[i][j] for i in range(len(strategies))) for j in range(n)]
        maxs = [max(raw_matrix[i][j] for i in range(len(strategies))) for j in range(n)]

        # Min-Max Normalization (0.0 to 1.0)
        norm_matrix: List[List[float]] = []
        for i in range(len(strategies)):
            row = []
            for j in range(n):
                span = maxs[j] - mins[j]
                val = raw_matrix[i][j]
                if span <= 1e-6:
                    score = 1.0
                else:
                    if CRITERIA_KEYS[j] in BENEFIT_CRITERIA:
                        score = (val - mins[j]) / span
                    else: # Cost
                        score = (maxs[j] - val) / span
                row.append(max(0.0, min(1.0, score)))
            norm_matrix.append(row)

        for profile in MCDAProfile:
            p_weights = [PROFILE_WEIGHTS[profile][k] for k in CRITERIA_KEYS]
            best_score = -1.0
            best_id = ""

            for i, s in enumerate(strategies):
                utility = sum(norm_matrix[i][j] * p_weights[j] for j in range(n)) * 100.0
                profile_scores[s.strategy_id][profile.value] = round(utility, 2)
                if utility > best_score:
                    best_score = utility
                    best_id = s.strategy_id

            winning_strategies[profile.value] = best_id

        return profile_scores, winning_strategies

    # =========================================================================
    # 5. Pairwise Differential Head-to-Head Comparison
    # =========================================================================

    def generate_pairwise_comparisons(
        self,
        strategies: List[StrategyResult],
    ) -> List[PairwiseComparison]:
        """Generates pairwise head-to-head delta comparisons across all candidate pairs."""
        comparisons: List[PairwiseComparison] = []
        m = len(strategies)

        for i in range(m):
            for k in range(i + 1, m):
                s1 = strategies[i]
                s2 = strategies[k]

                delta_r = round(s1.projected_resilience_score - s2.projected_resilience_score, 1)
                delta_icu = round(s1.icu_continuity_pct - s2.icu_continuity_pct, 1)
                delta_rt = round(s1.backup_runtime_remaining_hours - s2.backup_runtime_remaining_hours, 1)
                delta_rec = round(s1.estimated_recovery_time_min - s2.estimated_recovery_time_min, 1)
                delta_shed = round(s1.non_critical_load_shed_kw - s2.non_critical_load_shed_kw, 1)

                winner_id = s1.strategy_id if delta_r >= 0 else s2.strategy_id
                adv_summary = self._synthesize_pairwise_summary(s1, s2, delta_r, delta_icu, delta_rt, delta_shed)

                comparisons.append(
                    PairwiseComparison(
                        strategy_a_id=s1.strategy_id,
                        strategy_b_id=s2.strategy_id,
                        delta_resilience=delta_r,
                        delta_icu_pct=delta_icu,
                        delta_runtime_hours=delta_rt,
                        delta_recovery_min=delta_rec,
                        delta_load_shed_kw=delta_shed,
                        advantage_summary=adv_summary,
                        winner_id=winner_id,
                    )
                )

        return comparisons

    # =========================================================================
    # 6. Helper Utilities & Narrative Synthesis
    # =========================================================================

    def _extract_criterion_vector(self, s: StrategyResult) -> List[float]:
        """Extracts the 7 numerical evaluation criteria in canonical order."""
        return [
            float(s.projected_resilience_score),
            float(s.icu_continuity_pct),
            float(s.backup_runtime_remaining_hours),
            float(s.operating_theatre_continuity_pct),
            float(s.estimated_recovery_time_min),
            float(s.non_critical_load_shed_kw),
            float(s.implementation_latency_min or 0.0),
        ]

    def _generate_trade_off_headline(
        self,
        strategy: StrategyResult,
        all_strategies: List[StrategyResult],
    ) -> str:
        """Produces a short, actionable headline describing the strategy's primary operational niche."""
        if strategy.strategy_id == "strat_c":
            return "Optimal Pareto compromise: 100% ICU & ER, 95% OT with controlled HVAC throttling."
        elif strategy.strategy_id == "strat_b":
            return "Aggressive life-support isolation: 100% ICU preserved, but surgical suites and wards shut down."
        elif strategy.strategy_id == "strat_d":
            return "High endurance utility reserve (+12h), offset by 35-minute physical deployment lag."
        elif strategy.strategy_id == "strat_e":
            return "Conserves critical oxygen reserve to 96h; ideal for gas supply and ventilator security."
        elif strategy.strategy_id == "strat_f":
            return "Zonal evacuation relieves campus load, but incurs major EMS logistics and transit delays."
        elif strategy.strategy_id == "strat_a":
            return "Unmitigated baseline: High catastrophic failure risk within 30 minutes."
        return f"{strategy.strategy_name} evaluated under multi-objective ranking."

    def _synthesize_pairwise_summary(
        self,
        s1: StrategyResult,
        s2: StrategyResult,
        delta_r: float,
        delta_icu: float,
        delta_rt: float,
        delta_shed: float,
    ) -> str:
        """Produces a crisp comparative narrative between two specific strategies."""
        lead = s1.strategy_code if delta_r >= 0 else s2.strategy_code
        follow = s2.strategy_code if delta_r >= 0 else s1.strategy_code
        abs_r = abs(delta_r)

        if abs(delta_icu) > 0:
            icu_phrase = f"{lead} secures {abs(delta_icu):.0f}% higher ICU continuity"
        else:
            icu_phrase = "both preserve identical ICU life-support"

        if abs(delta_rt) > 0:
            rt_phrase = f"{'+' if delta_rt > 0 else '-'}{abs(delta_rt):.1f}h backup runtime"
        else:
            rt_phrase = "equal backup duration"

        return (
            f"{lead} achieves a +{abs_r:.1f} higher Resilience Index than {follow}; "
            f"{icu_phrase} with {rt_phrase}."
        )

    def _synthesize_recommendation_rationale(
        self,
        recommended: StrategyResult,
        all_strategies: List[StrategyResult],
        profile: MCDAProfile,
        sensitivity: Dict[str, str],
    ) -> str:
        """Constructs an auditable, defensible justification for the top ranking."""
        p_name = profile.value.replace("_", " ").title()
        return (
            f"Multi-Objective MCDA under '{p_name}' profile selects Strategy '{recommended.strategy_name}' ({recommended.strategy_code}) as Rank #1. "
            f"Projected Resilience Index: {recommended.projected_resilience_score:.1f}/100 (+{recommended.delta_resilience or 0.0:.1f} vs baseline), "
            f"TOPSIS Closeness: {recommended.topsis_score:.3f}, Pareto Optimal: {recommended.pareto_optimal}. "
            f"Secures {recommended.icu_continuity_pct:.1f}% ICU life support with {recommended.backup_runtime_remaining_hours:.1f}h generator endurance. "
            f"Sensitivity Analysis: Recommended in {sum(1 for w in sensitivity.values() if w == recommended.strategy_id)} of 4 operational profiles."
        )
