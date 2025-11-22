export interface ReviewResult {
    interval: number;
    repetition: number;
    efactor: number;
}

export function calculateReview(
    grade: 0 | 1 | 2 | 3 | 4 | 5, // 0-5 rating (Anki uses 1-4 usually, but SM-2 uses 0-5)
    previousInterval: number,
    previousRepetition: number,
    previousEfactor: number
): ReviewResult {
    let interval: number;
    let repetition: number;
    let efactor: number;

    if (grade >= 3) {
        if (previousRepetition === 0) {
            interval = 1;
        } else if (previousRepetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(previousInterval * previousEfactor);
        }
        repetition = previousRepetition + 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    efactor = previousEfactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    return { interval, repetition, efactor };
}

// Helper to map Anki buttons to SM-2 grades
// Again (1) -> 0 or 1 (Fail)
// Hard (2) -> 3 (Pass, hard)
// Good (3) -> 4 (Pass, good)
// Easy (4) -> 5 (Pass, easy)
export function mapButtonToGrade(button: 'again' | 'hard' | 'good' | 'easy'): 0 | 3 | 4 | 5 {
    switch (button) {
        case 'again': return 0;
        case 'hard': return 3;
        case 'good': return 4;
        case 'easy': return 5;
    }
}
