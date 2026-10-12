"""
RailBook AI - Intelligent Train Recommendation Engine
Scores and ranks trains using transparent weighted scoring and multi-criteria optimization.
Provides explicit recommendation rationales and badges.
"""

def compute_train_recommendations(trains_data, preferences=None):
    """
    Ranks trains according to multi-attribute utility theory and preference weights.

    trains_data: list of dicts with keys:
        - id
        - train_number
        - train_name
        - duration_minutes
        - min_fare
        - available_seats
        - departure_time (HH:MM)
    preferences: dict with:
        - priority: 'cheapest' | 'fastest' | 'timing' | 'balanced'
        - departure_preference: 'morning' | 'afternoon' | 'evening' | 'night' | 'any'
    """
    if not trains_data:
        return []

    preferences = preferences or {}
    priority = preferences.get('priority', 'balanced')
    timing_pref = preferences.get('departure_preference', 'any')

    # Weights configuration
    weights = {
        'balanced': {'fare': 0.35, 'duration': 0.35, 'availability': 0.15, 'timing': 0.15},
        'cheapest': {'fare': 0.60, 'duration': 0.15, 'availability': 0.15, 'timing': 0.10},
        'fastest': {'fare': 0.15, 'duration': 0.60, 'availability': 0.15, 'timing': 0.10},
        'timing': {'fare': 0.20, 'duration': 0.20, 'availability': 0.15, 'timing': 0.45},
    }.get(priority, {'fare': 0.35, 'duration': 0.35, 'availability': 0.15, 'timing': 0.15})

    fares = [float(t['min_fare']) for t in trains_data]
    durations = [float(t['duration_minutes']) for t in trains_data]
    seats = [float(t['available_seats']) for t in trains_data]

    min_fare, max_fare = min(fares), max(fares)
    min_dur, max_dur = min(durations), max(durations)
    max_seat = max(seats) if max(seats) > 0 else 1

    scored_trains = []

    for t in trains_data:
        fare_val = float(t['min_fare'])
        dur_val = float(t['duration_minutes'])
        seat_val = float(t['available_seats'])
        dep_time_str = str(t['departure_time'])

        # Parse hour
        hour = int(dep_time_str.split(':')[0]) if ':' in dep_time_str else 8

        # 1. Fare score: lower fare = higher score (0 to 1)
        fare_score = 1.0 if max_fare == min_fare else (max_fare - fare_val) / (max_fare - min_fare)

        # 2. Duration score: lower duration = higher score (0 to 1)
        dur_score = 1.0 if max_dur == min_dur else (max_dur - dur_val) / (max_dur - min_dur)

        # 3. Availability score: higher seats = higher score
        avail_score = min(1.0, seat_val / 50.0)

        # 4. Timing score
        timing_score = 0.5
        if timing_pref == 'morning' and (6 <= hour < 12):
            timing_score = 1.0
        elif timing_pref == 'afternoon' and (12 <= hour < 18):
            timing_score = 1.0
        elif timing_pref == 'evening' and (18 <= hour < 24):
            timing_score = 1.0
        elif timing_pref == 'night' and (0 <= hour < 6):
            timing_score = 1.0
        elif timing_pref == 'any':
            # Prefer comfortable travel hours (07:00 to 21:00)
            timing_score = 0.9 if (7 <= hour <= 21) else 0.6

        # Composite score (0 - 100)
        total_score = (
            fare_score * weights['fare'] +
            dur_score * weights['duration'] +
            avail_score * weights['availability'] +
            timing_score * weights['timing']
        ) * 100.0

        # Rationales / Badges
        reasons = []
        if fare_val == min_fare:
            reasons.append("Lowest Fare on Route")
        if dur_val == min_dur:
            reasons.append("Fastest Journey Time")
        elif dur_val <= min_dur + 30:
            reasons.append("High Speed Express")

        if seat_val > 40:
            reasons.append("High Seat Availability")
        elif seat_val > 15:
            reasons.append("Confirmed Seats Available")

        if timing_score >= 0.9:
            reasons.append(f"Optimal Departure ({dep_time_str[:5]})")

        if not reasons:
            reasons.append("Balanced Choice")

        scored_trains.append({
            'train_data': t,
            'ai_score': round(total_score, 1),
            'reasons': reasons,
            'fare_score': round(fare_score * 100, 1),
            'speed_score': round(dur_score * 100, 1),
            'availability_score': round(avail_score * 100, 1),
        })

    # Sort descending by ai_score
    scored_trains.sort(key=lambda x: x['ai_score'], reverse=True)

    for rank, item in enumerate(scored_trains, start=1):
        item['ai_rank'] = rank
        if rank == 1:
            item['badge'] = 'Top AI Pick'
        elif rank == 2:
            item['badge'] = 'Runner Up'
        else:
            item['badge'] = 'Recommended'

    return scored_trains
