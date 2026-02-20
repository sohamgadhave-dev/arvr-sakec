export const quizData = {
    'projectile': {
        title: 'Projectile Motion Quiz',
        questions: [
            {
                question: 'At what launch angle does a projectile achieve maximum range (on level ground)?',
                options: ['30°', '45°', '60°', '90°'],
                correct: 1,
                explanation: 'At 45°, sin(2θ) = sin(90°) = 1, which maximizes the range formula R = v²sin(2θ)/g.'
            },
            {
                question: 'If the initial velocity is doubled, by what factor does the range increase?',
                options: ['2 times', '3 times', '4 times', '8 times'],
                correct: 2,
                explanation: 'Range R = v²sin(2θ)/g. Since R ∝ v², doubling v gives 4× the range.'
            },
            {
                question: 'What is the vertical velocity of a projectile at its maximum height?',
                options: ['Maximum', 'Half of initial', 'Zero', 'Equal to horizontal velocity'],
                correct: 2,
                explanation: 'At maximum height, the vertical component of velocity becomes zero momentarily before the projectile descends.'
            },
            {
                question: 'The trajectory of a projectile in uniform gravity follows what shape?',
                options: ['Circle', 'Ellipse', 'Parabola', 'Hyperbola'],
                correct: 2,
                explanation: 'Under uniform gravity with no air resistance, the path is a parabola described by y = x·tan(θ) − gx²/(2v²cos²θ).'
            },
            {
                question: 'Two projectiles are launched at complementary angles (e.g., 30° and 60°) with the same speed. How do their ranges compare?',
                options: ['30° has greater range', '60° has greater range', 'They have equal range', 'Cannot be determined'],
                correct: 2,
                explanation: 'sin(2×30°) = sin(60°) and sin(2×60°) = sin(120°) = sin(60°). Both give the same value, so the ranges are equal.'
            }
        ]
    },
    'ohms-law': {
        title: "Ohm's Law Quiz",
        questions: [
            {
                question: "According to Ohm's Law, what happens to current when resistance is doubled (voltage constant)?",
                options: ['Current doubles', 'Current halves', 'Current stays the same', 'Current quadruples'],
                correct: 1,
                explanation: "I = V/R. If R doubles, I = V/(2R), so current is halved."
            },
            {
                question: 'What is the SI unit of electrical resistance?',
                options: ['Ampere', 'Volt', 'Ohm', 'Watt'],
                correct: 2,
                explanation: 'The SI unit of resistance is the Ohm (Ω), named after Georg Simon Ohm.'
            },
            {
                question: 'If a 12V battery drives a current of 3A through a resistor, what is the resistance?',
                options: ['3 Ω', '4 Ω', '36 Ω', '0.25 Ω'],
                correct: 1,
                explanation: 'R = V/I = 12/3 = 4 Ω'
            },
            {
                question: 'The V-I graph for an ohmic conductor is:',
                options: ['Curved line', 'Straight line through origin', 'Horizontal line', 'Parabola'],
                correct: 1,
                explanation: 'For an ohmic conductor, V is directly proportional to I, giving a straight line through the origin with slope equal to R.'
            },
            {
                question: 'What is the power dissipated by a 100Ω resistor with 2A flowing through it?',
                options: ['200 W', '400 W', '50 W', '100 W'],
                correct: 1,
                explanation: 'P = I²R = (2)² × 100 = 400 W. Alternatively, P = V×I where V = IR = 200V, so P = 200×2 = 400W.'
            }
        ]
    },
    'pendulum': {
        title: 'Simple Pendulum Quiz',
        questions: [
            {
                question: 'For a simple pendulum, the time period depends on:',
                options: ['Mass and length', 'Length and gravity', 'Mass and gravity', 'Mass, length, and gravity'],
                correct: 1,
                explanation: 'T = 2π√(L/g). The period depends only on length L and gravitational acceleration g, not on mass.'
            },
            {
                question: 'If the length of a simple pendulum is quadrupled, the time period:',
                options: ['Doubles', 'Quadruples', 'Halves', 'Stays the same'],
                correct: 0,
                explanation: 'T = 2π√(L/g). If L becomes 4L, then T\' = 2π√(4L/g) = 2 × 2π√(L/g) = 2T. The period doubles.'
            },
            {
                question: 'A pendulum on the Moon (g ≈ 1.6 m/s²) compared to Earth (g ≈ 9.8 m/s²) will have:',
                options: ['Shorter period', 'Longer period', 'Same period', 'No oscillation'],
                correct: 1,
                explanation: 'T = 2π√(L/g). Since g is smaller on the Moon, T is larger — the pendulum swings more slowly.'
            },
            {
                question: 'The formula T = 2π√(L/g) is most accurate for:',
                options: ['Any amplitude', 'Large angles only', 'Small angles (< ~15°)', 'Exactly 45°'],
                correct: 2,
                explanation: 'This formula assumes sin(θ) ≈ θ (small angle approximation), valid for angles less than about 15°.'
            },
            {
                question: 'At what point in its swing does the pendulum bob have maximum speed?',
                options: ['At the extreme positions', 'At the equilibrium (lowest) point', 'Halfway between', 'Speed is constant'],
                correct: 1,
                explanation: 'At the lowest point, all potential energy is converted to kinetic energy, giving maximum speed.'
            }
        ]
    }
};
