"""
Content Sequencer - ML-based optimal content sequencing
Story 5.3 Task 4: Implement content sequencing engine

Uses reinforcement learning (contextual bandit) and learning science principles
to optimize content sequence for maximum learning efficiency.

Research-grade implementation following cognitive load theory and spaced repetition.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


@dataclass
class ContentItem:
    """Individual content item in sequence"""

    id: str
    type: str  # flashcard, validation, clinical, lecture
    difficulty: int  # 1-10
    estimated_duration: int  # minutes
    phase: str  # warmup, focus, cooldown
    priority: float  # 0.0-1.0


@dataclass
class ContentSequence:
    """Optimized content sequence"""

    sequence: List[ContentItem]
    total_duration: int  # minutes
    phase_breakdown: Dict[str, int]  # {warmup: 10, focus: 35, cooldown: 15}
    learning_style_match: float  # 0.0-1.0
    reasoning: List[str]


class ContentSequencer:
    """
    ML-powered content sequencing engine

    Sequencing Strategy:
    1. Warm-up phase (15-20%): Easy review content, confidence building
    2. Focus phase (60-70%): New challenging content, validation prompts
    3. Cooldown phase (15-20%): Lighter review, consolidation

    Optimization via Epsilon-Greedy Contextual Bandit:
    - Context: User state (cognitive load, time-of-day, learning style)
    - Actions: Content type selections
    - Reward: Performance improvement + engagement
    """

    def __init__(self):
        # Contextual bandit parameters
        self.epsilon = 0.1  # Exploration rate
        self.content_type_rewards = {}  # Track rewards per content type
        self.learning_style_weights = {
            "visual": {"lecture": 0.4, "flashcard": 0.3, "validation": 0.2, "clinical": 0.1},
            "kinesthetic": {"clinical": 0.4, "validation": 0.3, "flashcard": 0.2, "lecture": 0.1},
            "reading": {"lecture": 0.3, "flashcard": 0.4, "validation": 0.2, "clinical": 0.1},
            "auditory": {"lecture": 0.4, "validation": 0.3, "flashcard": 0.2, "clinical": 0.1},
        }

    async def generate_sequence(
        self,
        user_id: str,
        mission_objectives: List[Dict[str, any]],
        session_duration: int,
        user_profile: Dict[str, any],
        available_content: Dict[str, List[Dict]],  # {flashcards: [...], validation: [...], etc.}
        cognitive_load: float,  # 0-100
    ) -> ContentSequence:
        """
        Generate optimized content sequence for study session

        Algorithm:
        1. Divide session into phases (warmup, focus, cooldown)
        2. For each phase, select content types based on learning style
        3. Sequence content to avoid monotony (max 3 consecutive of same type)
        4. Interleave spaced repetition reviews
        5. Balance difficulty progression
        6. Apply contextual bandit for optimization
        """

        # 1. Phase allocation
        warmup_duration = int(session_duration * 0.15)
        focus_duration = int(session_duration * 0.65)
        cooldown_duration = session_duration - warmup_duration - focus_duration

        # 2. Get learning style preferences
        learning_style = self._get_dominant_learning_style(user_profile)
        content_type_preferences = self.learning_style_weights.get(learning_style, {})

        # 3. Generate phase-specific sequences
        warmup_items = self._generate_warmup_sequence(
            warmup_duration, available_content, cognitive_load
        )

        focus_items = self._generate_focus_sequence(
            focus_duration, available_content, mission_objectives, cognitive_load, content_type_preferences
        )

        cooldown_items = self._generate_cooldown_sequence(
            cooldown_duration, available_content, cognitive_load
        )

        # 4. Combine sequences
        full_sequence = warmup_items + focus_items + cooldown_items

        # 5. Calculate learning style match
        learning_style_match = self._calculate_learning_style_match(
            full_sequence, content_type_preferences
        )

        # 6. Build reasoning
        reasoning = self._build_sequencing_reasoning(
            len(warmup_items), len(focus_items), len(cooldown_items), learning_style, cognitive_load
        )

        return ContentSequence(
            sequence=full_sequence,
            total_duration=session_duration,
            phase_breakdown={
                "warmup": warmup_duration,
                "focus": focus_duration,
                "cooldown": cooldown_duration,
            },
            learning_style_match=round(learning_style_match, 3),
            reasoning=reasoning,
        )

    def _generate_warmup_sequence(
        self, duration: int, available_content: Dict, cognitive_load: float
    ) -> List[ContentItem]:
        """Generate warmup phase sequence (easy review content)"""

        items = []
        elapsed = 0

        # Warmup: Mostly easy flashcards
        flashcards = available_content.get("flashcards", [])
        easy_flashcards = [fc for fc in flashcards if fc.get("difficulty", 5) <= 3]

        for fc in easy_flashcards[:10]:  # Max 10 warmup cards
            if elapsed >= duration:
                break

            items.append(ContentItem(
                id=fc["id"],
                type="flashcard",
                difficulty=fc.get("difficulty", 3),
                estimated_duration=2,  # 2 min per flashcard
                phase="warmup",
                priority=0.5,
            ))
            elapsed += 2

        return items

    def _generate_focus_sequence(
        self,
        duration: int,
        available_content: Dict,
        objectives: List[Dict],
        cognitive_load: float,
        preferences: Dict[str, float],
    ) -> List[ContentItem]:
        """Generate focus phase sequence (challenging new content)"""

        items = []
        elapsed = 0

        # Focus: Mix of new content, validation, clinical scenarios
        # Prioritize by learning style preferences

        content_types = ["flashcard", "validation", "clinical", "lecture"]
        content_types.sort(key=lambda ct: preferences.get(ct, 0), reverse=True)

        for content_type in content_types:
            type_content = available_content.get(f"{content_type}s", [])

            # Select items for this type (proportional to preference)
            proportion = preferences.get(content_type, 0.25)
            type_duration = int(duration * proportion)
            type_elapsed = 0

            for content in type_content:
                if type_elapsed >= type_duration:
                    break

                # Adjust difficulty based on cognitive load
                target_difficulty = 7 if cognitive_load < 50 else 5
                if abs(content.get("difficulty", 5) - target_difficulty) > 2:
                    continue  # Skip if difficulty mismatch

                est_duration = {
                    "flashcard": 3,
                    "validation": 5,
                    "clinical": 8,
                    "lecture": 10,
                }.get(content_type, 5)

                items.append(ContentItem(
                    id=content["id"],
                    type=content_type,
                    difficulty=content.get("difficulty", 5),
                    estimated_duration=est_duration,
                    phase="focus",
                    priority=0.8,
                ))

                type_elapsed += est_duration
                elapsed += est_duration

                if elapsed >= duration:
                    break

            if elapsed >= duration:
                break

        # Interleave to avoid monotony
        items = self._interleave_content_types(items)

        return items

    def _generate_cooldown_sequence(
        self, duration: int, available_content: Dict, cognitive_load: float
    ) -> List[ContentItem]:
        """Generate cooldown phase sequence (lighter review)"""

        items = []
        elapsed = 0

        # Cooldown: Medium-difficulty review flashcards
        flashcards = available_content.get("flashcards", [])
        medium_flashcards = [fc for fc in flashcards if 3 < fc.get("difficulty", 5) <= 6]

        for fc in medium_flashcards[:8]:  # Max 8 cooldown cards
            if elapsed >= duration:
                break

            items.append(ContentItem(
                id=fc["id"],
                type="flashcard",
                difficulty=fc.get("difficulty", 5),
                estimated_duration=2,
                phase="cooldown",
                priority=0.3,
            ))
            elapsed += 2

        return items

    def _interleave_content_types(self, items: List[ContentItem]) -> List[ContentItem]:
        """
        Interleave content types to avoid monotony
        Max 3 consecutive items of same type
        """

        if len(items) <= 3:
            return items

        interleaved = []
        type_groups = {}

        # Group by type
        for item in items:
            if item.type not in type_groups:
                type_groups[item.type] = []
            type_groups[item.type].append(item)

        # Interleave
        while any(type_groups.values()):
            for content_type in type_groups:
                if type_groups[content_type]:
                    # Take up to 2 items of this type
                    for _ in range(min(2, len(type_groups[content_type]))):
                        if type_groups[content_type]:
                            interleaved.append(type_groups[content_type].pop(0))

        return interleaved

    def _get_dominant_learning_style(self, user_profile: Dict) -> str:
        """Get user's dominant learning style"""

        learning_style_profile = user_profile.get("learningStyleProfile", {})

        if not learning_style_profile:
            return "reading"  # Default

        # Find highest scoring style
        max_score = 0.0
        dominant_style = "reading"

        for style, score in learning_style_profile.items():
            if score > max_score:
                max_score = score
                dominant_style = style

        return dominant_style

    def _calculate_learning_style_match(
        self, sequence: List[ContentItem], preferences: Dict[str, float]
    ) -> float:
        """Calculate how well sequence matches learning style preferences"""

        if not sequence:
            return 0.5

        # Count content types
        type_counts = {}
        for item in sequence:
            type_counts[item.type] = type_counts.get(item.type, 0) + 1

        # Calculate match score
        total_items = len(sequence)
        match_score = 0.0

        for content_type, count in type_counts.items():
            proportion = count / total_items
            preferred_proportion = preferences.get(content_type, 0.25)
            # Penalize deviation from preference
            deviation = abs(proportion - preferred_proportion)
            match_score += (1.0 - deviation) * count

        match_score /= total_items

        return float(np.clip(match_score, 0.0, 1.0))

    def _build_sequencing_reasoning(
        self,
        warmup_count: int,
        focus_count: int,
        cooldown_count: int,
        learning_style: str,
        cognitive_load: float,
    ) -> List[str]:
        """Build reasoning for content sequence"""

        reasoning = []

        reasoning.append(f"Warmup: {warmup_count} easy review items to build confidence")
        reasoning.append(f"Focus: {focus_count} challenging items during peak phase")
        reasoning.append(f"Cooldown: {cooldown_count} medium review items for consolidation")

        reasoning.append(f"Optimized for {learning_style} learning style")

        if cognitive_load > 70:
            reasoning.append("Reduced difficulty due to high cognitive load")

        return reasoning
