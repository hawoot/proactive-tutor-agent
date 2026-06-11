"""Curated question bank for the UK A-level Maths curriculum.
QUESTIONS maps skill name -> list of {text, answer, commentary}.
- text: plain/unicode notation (phone-friendly), self-contained.
- answer: the canonical worked answer the marker judges against.
- commentary: marking guidance - what earns partial credit, common slips.
Take g = 9.8 m/s^2 in Mechanics unless stated.
"""

QUESTIONS = {
    # ---------------- PURE: Proof ----------------
    "Proof by contradiction": [
        {"text": "Prove by contradiction that sqrt(2) is irrational.",
         "answer": "Assume sqrt(2) = p/q with p, q integers in lowest terms. Then "
                   "p^2 = 2q^2, so p^2 is even, so p is even: p = 2k. Then 4k^2 = 2q^2, "
                   "so q^2 = 2k^2 is even, so q is even. Both p and q even contradicts "
                   "lowest terms. Hence sqrt(2) is irrational.",
         "commentary": "Full marks needs: lowest-terms assumption stated, both p and q "
                       "shown even, contradiction stated. Partial: correct structure but "
                       "missing the lowest-terms contradiction step."},
        {"text": "Prove by contradiction that there are infinitely many prime numbers.",
         "answer": "Assume finitely many primes p1, ..., pn. Let N = p1*p2*...*pn + 1. "
                   "Dividing N by any pi leaves remainder 1, so no pi divides N. But N > 1 "
                   "has a prime factor, which is not in the list - contradiction. Hence "
                   "infinitely many primes.",
         "commentary": "Key steps: construct N, argue no listed prime divides it, note N "
                       "must have some prime factor. Partial: builds N but doesn't justify "
                       "why its prime factor is new."},
    ],
    "Disproof by counterexample": [
        {"text": "Disprove the statement: 'n^2 + n + 41 is prime for every positive integer n'.",
         "answer": "n = 41 gives 41^2 + 41 + 41 = 41(41 + 1 + 1) = 41*43, not prime. "
                   "(n = 40 also works: 40^2 + 40 + 41 = 1681 = 41^2.)",
         "commentary": "Any single valid counterexample with the factorisation shown earns "
                       "full marks. Claiming a number is composite without showing a factor "
                       "is partial."},
        {"text": "Disprove the statement: 'for all real numbers a and b, if a > b then a^2 > b^2'.",
         "answer": "Take a = 1, b = -2. Then a > b but a^2 = 1 < 4 = b^2. The statement is false.",
         "commentary": "Any counterexample using a negative b with |b| > |a| works. Both "
                       "conditions (a > b and a^2 <= b^2) must be checked explicitly."},
    ],

    # ---------------- PURE: Algebra & Functions ----------------
    "Laws of indices & surds": [
        {"text": "Simplify (3*sqrt(5) - sqrt(20)) / sqrt(5), giving an integer answer.",
         "answer": "sqrt(20) = 2*sqrt(5), so numerator = 3*sqrt(5) - 2*sqrt(5) = sqrt(5). "
                   "Then sqrt(5)/sqrt(5) = 1.",
         "commentary": "Partial for correctly writing sqrt(20) = 2*sqrt(5) but slipping in "
                       "the division."},
        {"text": "Solve 8^(x+1) = 1 / 4^(2x).",
         "answer": "8^(x+1) = 2^(3x+3); 1/4^(2x) = 2^(-4x). So 3x + 3 = -4x, giving x = -3/7.",
         "commentary": "Method: express both sides as powers of 2 and equate exponents. "
                       "Partial: correct conversion with an arithmetic slip."},
    ],
    "Completing the square": [
        {"text": "Write x^2 - 6x + 11 in the form (x - a)^2 + b, and state the minimum point of y = x^2 - 6x + 11.",
         "answer": "(x - 3)^2 + 2. Minimum point (3, 2).",
         "commentary": "Both the completed-square form and the minimum point are needed for "
                       "full marks; one of the two is partial."},
        {"text": "Express 2x^2 + 8x + 3 in the form a(x + p)^2 + q and state its minimum value.",
         "answer": "2(x^2 + 4x) + 3 = 2(x + 2)^2 - 8 + 3 = 2(x + 2)^2 - 5. Minimum value -5 (at x = -2).",
         "commentary": "Common slip: forgetting to multiply the -4 by the factor 2 (giving -1 "
                       "instead of -5) - that's partial with correct method."},
    ],
    "Quadratic & linear inequalities": [
        {"text": "Solve the inequality x^2 - 5x + 6 < 0.",
         "answer": "Factorise: (x - 2)(x - 3) < 0, so 2 < x < 3.",
         "commentary": "Answer must be the open interval between the roots. Partial: correct "
                       "roots but wrong region or non-strict inequality."},
        {"text": "Find the set of values of k for which kx^2 + 4x + k = 0 has no real roots (k ≠ 0).",
         "answer": "Discriminant: 16 - 4k^2 < 0, so k^2 > 4, so k > 2 or k < -2.",
         "commentary": "Partial: correct discriminant condition but solving k^2 > 4 as "
                       "-2 > k > 2 or only one branch."},
    ],
    "Polynomial division & factor theorem": [
        {"text": "f(x) = 2x^3 - x^2 - 13x - 6. Show that (x - 3) is a factor of f(x) and factorise f(x) completely.",
         "answer": "f(3) = 54 - 9 - 39 - 6 = 0, so (x - 3) is a factor. Division gives "
                   "2x^2 + 5x + 2 = (2x + 1)(x + 2). So f(x) = (x - 3)(2x + 1)(x + 2).",
         "commentary": "f(3) = 0 must be shown numerically. Partial: factor theorem applied "
                       "correctly but quadratic factor wrong or not fully factorised."},
        {"text": "When x^3 - 2x^2 + ax + 6 is divided by (x - 1) the remainder is 2. Find a.",
         "answer": "Remainder theorem: f(1) = 1 - 2 + a + 6 = a + 5 = 2, so a = -3.",
         "commentary": "One-step remainder theorem. Wrong sign in f(1) is partial with method shown."},
    ],
    "Partial fractions": [
        {"text": "Express (5x + 1) / ((x - 1)(x + 2)) in partial fractions.",
         "answer": "A/(x-1) + B/(x+2): A = (5*1+1)/(1+2) = 2, B = (5*(-2)+1)/((-2)-1) = 3. "
                   "So 2/(x - 1) + 3/(x + 2).",
         "commentary": "Cover-up or simultaneous equations both fine. Partial: correct setup, "
                       "one coefficient wrong."},
        {"text": "Express (x^2 + 1) / (x^2 - 1) in the form A + B/(x - 1) + C/(x + 1).",
         "answer": "(x^2+1)/(x^2-1) = 1 + 2/(x^2-1) = 1 + 1/(x - 1) - 1/(x + 1). "
                   "So A = 1, B = 1, C = -1.",
         "commentary": "The improper fraction must be reduced first (A = 1). Skipping that "
                       "step and forcing B, C only is wrong; correct A with one slip in B/C "
                       "is partial."},
    ],
    "Functions: composite, inverse & modulus": [
        {"text": "f(x) = 2x + 3 and g(x) = x^2 - 1. Find fg(x), and solve fg(x) = 5.",
         "answer": "fg(x) = 2(x^2 - 1) + 3 = 2x^2 + 1. Then 2x^2 + 1 = 5 gives x^2 = 2, "
                   "x = sqrt(2) or x = -sqrt(2).",
         "commentary": "Order matters: fg means f applied to g(x). Computing gf instead is "
                       "wrong method. Both roots needed for full marks."},
        {"text": "f(x) = (2x + 1)/(x - 3), x ≠ 3. Find f^(-1)(x) and state its domain restriction.",
         "answer": "y(x - 3) = 2x + 1 -> x(y - 2) = 3y + 1 -> f^(-1)(x) = (3x + 1)/(x - 2), x ≠ 2.",
         "commentary": "Partial: correct algebra but missing the x ≠ 2 restriction."},
    ],

    # ---------------- PURE: Coordinate Geometry ----------------
    "Straight line equations": [
        {"text": "A = (1, 5) and B = (7, 2). Find the equation of the perpendicular bisector of AB.",
         "answer": "Midpoint (4, 3.5). Gradient of AB = (2-5)/(7-1) = -1/2, so perpendicular "
                   "gradient = 2. Equation: y - 3.5 = 2(x - 4), i.e. y = 2x - 4.5.",
         "commentary": "Needs midpoint, negative-reciprocal gradient and a correct line "
                       "through the midpoint. Two of the three earns partial."},
        {"text": "The line 3x + 4y = 24 meets the x-axis at A and the y-axis at B. Find the area of triangle OAB where O is the origin.",
         "answer": "A = (8, 0), B = (0, 6). Area = (1/2)*8*6 = 24.",
         "commentary": "Partial: correct intercepts but area slip."},
    ],
    "Circle equations & tangents": [
        {"text": "Find the centre and radius of the circle x^2 + y^2 - 6x + 4y - 12 = 0.",
         "answer": "(x - 3)^2 + (y + 2)^2 = 12 + 9 + 4 = 25. Centre (3, -2), radius 5.",
         "commentary": "Completing the square in both variables. Sign error in the centre "
                       "with correct radius is partial."},
        {"text": "Find the equation of the tangent to the circle x^2 + y^2 = 25 at the point (3, 4).",
         "answer": "Radius gradient = 4/3, so tangent gradient = -3/4. "
                   "y - 4 = (-3/4)(x - 3), i.e. 3x + 4y = 25.",
         "commentary": "Key idea: tangent is perpendicular to the radius at the point. "
                       "Differentiating implicitly is equally valid."},
    ],
    "Parametric equations": [
        {"text": "A curve has parametric equations x = 2t, y = t^2. Find its Cartesian equation.",
         "answer": "t = x/2, so y = x^2/4.",
         "commentary": "Direct elimination; full marks for y = x^2/4 or equivalent."},
        {"text": "A curve is given by x = 3cos(t), y = 3sin(t) + 1. Find its Cartesian equation and describe the curve.",
         "answer": "cos(t) = x/3, sin(t) = (y-1)/3; squaring and adding: x^2 + (y - 1)^2 = 9. "
                   "A circle, centre (0, 1), radius 3.",
         "commentary": "Partial: correct equation without identifying centre/radius."},
    ],

    # ---------------- PURE: Sequences & Series ----------------
    "Binomial expansion": [
        {"text": "Expand (1 + 2x)^5 in ascending powers of x up to and including the x^3 term.",
         "answer": "1 + 5(2x) + 10(2x)^2 + 10(2x)^3 + ... = 1 + 10x + 40x^2 + 80x^3.",
         "commentary": "Common slip: forgetting to raise 2 to the power (e.g. 10*2x^2). "
                       "Correct binomial coefficients with that slip is partial."},
        {"text": "Find the first three terms of the expansion of (1 - 3x)^(1/2) and state the range of x for which it is valid.",
         "answer": "1 + (1/2)(-3x) + ((1/2)(-1/2)/2)(-3x)^2 = 1 - (3/2)x - (9/8)x^2. "
                   "Valid for |x| < 1/3.",
         "commentary": "Partial: correct terms but missing or wrong validity range. Watch the "
                       "sign of the x^2 term (it is negative)."},
    ],
    "Arithmetic sequences & series": [
        {"text": "An arithmetic sequence has 5th term 17 and 12th term 38. Find the sum of the first 20 terms.",
         "answer": "7d = 21 so d = 3; a = 17 - 4*3 = 5. S20 = (20/2)(2*5 + 19*3) = 10*67 = 670.",
         "commentary": "Partial: correct a and d but sum formula slip."},
        {"text": "Find the smallest n for which 1 + 2 + 3 + ... + n exceeds 1000.",
         "answer": "n(n + 1)/2 > 1000 -> n^2 + n - 2000 > 0 -> n ≈ 44.2, so n = 45 "
                   "(45*46/2 = 1035; 44*45/2 = 990).",
         "commentary": "Full marks needs checking both n = 44 fails and n = 45 works (or "
                       "correct rounding argument)."},
    ],
    "Geometric sequences & series": [
        {"text": "A geometric series has first term 81 and common ratio 2/3. Find its sum to infinity.",
         "answer": "S_inf = 81 / (1 - 2/3) = 81/(1/3) = 243.",
         "commentary": "One-step formula; must note |r| < 1 implicitly or explicitly."},
        {"text": "A geometric sequence has 2nd term 12 and 5th term 96. Find the first term and the sum of the first 8 terms.",
         "answer": "r^3 = 96/12 = 8 so r = 2; a = 12/2 = 6. S8 = 6(2^8 - 1)/(2 - 1) = 6*255 = 1530.",
         "commentary": "Partial: correct a and r with a sum slip."},
    ],
    "Recurrence relations": [
        {"text": "A sequence is defined by u1 = 3 and u(n+1) = 2*u(n) - 1. Find u4.",
         "answer": "u2 = 5, u3 = 9, u4 = 17.",
         "commentary": "Straight iteration; any single arithmetic slip is partial if method shown."},
        {"text": "x1 = 1 and x(n+1) = 4 - x(n). Describe the behaviour of the sequence and find x100.",
         "answer": "Terms: 1, 3, 1, 3, ... periodic with order 2. Even-indexed terms are 3, "
                   "so x100 = 3.",
         "commentary": "Needs both 'periodic (order 2)' and the correct x100."},
    ],

    # ---------------- PURE: Trigonometry ----------------
    "Trig equations in an interval": [
        {"text": "Solve 2*sin(x) = 1 for 0 <= x < 360 degrees.",
         "answer": "sin(x) = 1/2: x = 30 or x = 150 degrees.",
         "commentary": "Both solutions required; one only is partial."},
        {"text": "Solve cos(2x) = 0.5 for 0 <= x < 180 degrees.",
         "answer": "2x = 60 or 300 (for 0 <= 2x < 360), so x = 30 or x = 150 degrees.",
         "commentary": "Common slip: missing the 300-degree branch. Doubling the interval "
                       "for 2x is the key step."},
    ],
    "Trig identities": [
        {"text": "Prove that tan(x) + 1/tan(x) ≡ 1/(sin(x)cos(x)).",
         "answer": "LHS = sin/cos + cos/sin = (sin^2 + cos^2)/(sin*cos) = 1/(sin(x)cos(x)).",
         "commentary": "Needs common denominator and use of sin^2 + cos^2 = 1. Working from "
                       "both sides simultaneously is acceptable if logical."},
        {"text": "Show that 1/(1 - sin x) + 1/(1 + sin x) ≡ 2*sec^2(x).",
         "answer": "Sum = ((1+sin x)+(1-sin x))/((1-sin x)(1+sin x)) = 2/(1 - sin^2 x) "
                   "= 2/cos^2(x) = 2*sec^2(x).",
         "commentary": "Partial: correct combination but failing to use 1 - sin^2 = cos^2."},
    ],
    "Addition & double angle formulae": [
        {"text": "Using sin(A + B), find the exact value of sin(75 degrees).",
         "answer": "sin75 = sin(45+30) = sin45*cos30 + cos45*sin30 "
                   "= (sqrt2/2)(sqrt3/2) + (sqrt2/2)(1/2) = (sqrt6 + sqrt2)/4.",
         "commentary": "Exact surd form required; decimal answer is partial at best."},
        {"text": "Solve sin(2x) = sin(x) for 0 <= x < 360 degrees.",
         "answer": "2 sin x cos x - sin x = 0 -> sin x (2cos x - 1) = 0. "
                   "sin x = 0: x = 0, 180. cos x = 1/2: x = 60, 300. Solutions: 0, 60, 180, 300.",
         "commentary": "Dividing both sides by sin x loses the x = 0, 180 solutions - that's "
                       "the classic error, partial at best."},
    ],
    "R-alpha form": [
        {"text": "Express 3*sin(x) + 4*cos(x) in the form R*sin(x + a) with R > 0 and 0 < a < 90 degrees, and state the maximum value.",
         "answer": "R = 5, tan(a) = 4/3 so a ≈ 53.1 degrees. Maximum value 5.",
         "commentary": "Partial: correct R with wrong a (often tan(a) = 3/4 mix-up)."},
        {"text": "Write 5*sin(x) - 12*cos(x) as R*sin(x - a), and state the minimum value of the expression.",
         "answer": "R = 13, tan(a) = 12/5 so a ≈ 67.4 degrees. Minimum value -13.",
         "commentary": "R = sqrt(25 + 144) = 13; minimum of R sin(...) is -R."},
    ],
    "Radians, arcs & sectors": [
        {"text": "A sector has radius 6 cm and angle 1.2 radians. Find the arc length and the sector area.",
         "answer": "Arc = r*theta = 7.2 cm. Area = (1/2)r^2*theta = 21.6 cm^2.",
         "commentary": "Both values needed; one correct is partial."},
        {"text": "A sector of radius 8 cm has area 24 cm^2. Find the angle in radians and the arc length.",
         "answer": "theta = 2*24/64 = 0.75 rad. Arc = 8*0.75 = 6 cm.",
         "commentary": "Rearranging the area formula is the method mark."},
    ],

    # ---------------- PURE: Exponentials & Logarithms ----------------
    "Laws of logarithms": [
        {"text": "Solve log2(x) + log2(x - 6) = 4.",
         "answer": "log2(x(x-6)) = 4 -> x^2 - 6x = 16 -> (x-8)(x+2) = 0. x = 8 "
                   "(x = -2 rejected: logs of negatives undefined).",
         "commentary": "Full marks requires rejecting x = -2 with a reason."},
        {"text": "Write log(a^2 * b / sqrt(c)) in terms of log(a), log(b) and log(c).",
         "answer": "2*log(a) + log(b) - (1/2)*log(c).",
         "commentary": "Each law applied correctly; one slip is partial."},
    ],
    "Exponential equations": [
        {"text": "Solve e^(2x) - 5e^x + 6 = 0, giving exact answers.",
         "answer": "Let u = e^x: u^2 - 5u + 6 = 0 -> u = 2 or 3. x = ln(2) or x = ln(3).",
         "commentary": "Quadratic-in-disguise method. Decimal answers are partial (exact "
                       "requested)."},
        {"text": "Solve 3^(2x+1) = 20, giving your answer to 3 significant figures.",
         "answer": "(2x+1)ln3 = ln20 -> 2x + 1 = ln20/ln3 ≈ 2.727 -> x ≈ 0.863.",
         "commentary": "Any correct log base works. Accept 0.863-0.864."},
    ],
    "Exponential modelling": [
        {"text": "The mass of a radioactive sample is m = 50*e^(-0.02t) grams (t in years). State the initial mass, find the mass after 30 years, and find how long until the mass halves.",
         "answer": "Initial 50 g. At t = 30: 50e^(-0.6) ≈ 27.4 g. Half-life: e^(-0.02t) = 0.5 "
                   "-> t = ln(2)/0.02 ≈ 34.7 years.",
         "commentary": "Three parts - award partial proportionally. Interpretation in context "
                       "(units) expected."},
        {"text": "A population grows as P = A*b^t. P = 2000 at t = 0 and P = 16000 at t = 3. Find A and b, and the time at which P = 64000.",
         "answer": "A = 2000; b^3 = 8 so b = 2. 2000*2^t = 64000 -> 2^t = 32 -> t = 5.",
         "commentary": "Partial: A and b correct, final solve slips."},
    ],

    # ---------------- PURE: Differentiation ----------------
    "Differentiation rules": [
        {"text": "Differentiate y = x^2 * sin(x).",
         "answer": "dy/dx = 2x*sin(x) + x^2*cos(x) (product rule).",
         "commentary": "Product rule with both terms; missing one term is partial."},
        {"text": "Differentiate y = e^(3x) / (x^2 + 1).",
         "answer": "Quotient rule: dy/dx = (3e^(3x)(x^2+1) - 2x*e^(3x)) / (x^2+1)^2 "
                   "= e^(3x)(3x^2 - 2x + 3)/(x^2+1)^2.",
         "commentary": "Chain rule needed for e^(3x) (factor 3). Unsimplified correct forms "
                       "get full marks."},
    ],
    "Differentiation from first principles": [
        {"text": "Differentiate f(x) = x^2 from first principles.",
         "answer": "limit as h->0 of ((x+h)^2 - x^2)/h = limit of (2xh + h^2)/h = "
                   "limit of (2x + h) = 2x.",
         "commentary": "The limit notation and the h->0 step must appear; quoting the answer "
                       "without the limit process is wrong by definition of the task."},
        {"text": "Differentiate f(x) = 3x^2 - 2x from first principles.",
         "answer": "(f(x+h)-f(x))/h = (6xh + 3h^2 - 2h)/h = 6x + 3h - 2 -> 6x - 2 as h -> 0.",
         "commentary": "Same requirements: expansion, division by h, explicit limit."},
    ],
    "Stationary points & curve sketching": [
        {"text": "Find the stationary points of y = x^3 - 3x^2 - 9x + 5 and determine their nature.",
         "answer": "y' = 3x^2 - 6x - 9 = 3(x-3)(x+1) = 0: x = -1, 3. y'' = 6x - 6: "
                   "y''(-1) = -12 < 0 so maximum at (-1, 10); y''(3) = 12 > 0 so minimum at (3, -22).",
         "commentary": "Partial: correct x-values without nature test or without y-coordinates."},
        {"text": "y = x + 4/x for x ≠ 0. Find and classify the stationary points.",
         "answer": "y' = 1 - 4/x^2 = 0 -> x = ±2. y'' = 8/x^3: at x = 2, y'' > 0, minimum (2, 4); "
                   "at x = -2, y'' < 0, maximum (-2, -4).",
         "commentary": "Note the 'minimum above the maximum' surprise is correct here."},
    ],
    "Implicit differentiation": [
        {"text": "The curve x^3 + y^3 = 9xy passes through (2, 4). Find dy/dx at that point.",
         "answer": "3x^2 + 3y^2 y' = 9y + 9x y' -> y' = (3y - x^2)/(y^2 - 3x). "
                   "At (2,4): (12 - 4)/(16 - 6) = 8/10 = 4/5.",
         "commentary": "Product rule on 9xy is the key step; missing it is wrong method."},
        {"text": "Find dy/dx for the curve x^2 + 2xy + 3y^2 = 6 at the point (1, 1).",
         "answer": "2x + 2y + 2x y' + 6y y' = 0 -> y' = -(x + y)/(x + 3y). At (1,1): -2/4 = -1/2.",
         "commentary": "Partial: correct differentiation, slip in rearrangement."},
    ],
    "Optimisation problems": [
        {"text": "An open-topped box has a square base of side x cm and volume 32 cm^3. Show that its surface area is S = x^2 + 128/x, and find the value of x that minimises S.",
         "answer": "Height h = 32/x^2; S = x^2 + 4xh = x^2 + 128/x. S' = 2x - 128/x^2 = 0 "
                   "-> x^3 = 64 -> x = 4 (S'' = 2 + 256/x^3 > 0, minimum). S = 48 cm^2.",
         "commentary": "Award partial for correct S and derivative but no justification of "
                       "minimum; the 'show that' step must be derived, not assumed."},
        {"text": "A rectangle has perimeter 40 cm. Prove that its area is maximised when it is a square, and state the maximum area.",
         "answer": "Sides x and 20 - x: A = 20x - x^2, A' = 20 - 2x = 0 -> x = 10 "
                   "(A'' = -2 < 0, maximum). Square of side 10, area 100 cm^2.",
         "commentary": "Needs the second-derivative (or equivalent) justification for 'prove'."},
    ],
    "Connected rates of change": [
        {"text": "Air is pumped into a spherical balloon at 100 cm^3 per second. Find the rate of increase of the radius when r = 5 cm. (V = (4/3)*pi*r^3)",
         "answer": "dV/dr = 4*pi*r^2 = 100*pi at r = 5. dr/dt = (dV/dt)/(dV/dr) = "
                   "100/(100*pi) = 1/pi ≈ 0.318 cm/s.",
         "commentary": "Chain rule setup dV/dt = dV/dr * dr/dt is the method mark."},
        {"text": "The side of a cube increases at 0.1 cm/s. Find the rate of increase of the volume when the side is 4 cm.",
         "answer": "V = s^3, dV/dt = 3s^2 * ds/dt = 3*16*0.1 = 4.8 cm^3/s.",
         "commentary": "Units expected in the answer."},
    ],

    # ---------------- PURE: Integration ----------------
    "Standard integrals": [
        {"text": "Find the integral of (6x^2 - 4/x^2 + 1/x) dx.",
         "answer": "2x^3 + 4/x + ln|x| + c.",
         "commentary": "Watch the sign on the 4/x term (-4x^(-2) integrates to +4/x). "
                       "Missing + c loses the final mark."},
        {"text": "Find the integral of (4*cos(2x) + e^(-x)) dx.",
         "answer": "2*sin(2x) - e^(-x) + c.",
         "commentary": "Both 'divide by inner derivative' steps needed (2 and -1)."},
    ],
    "Areas under & between curves": [
        {"text": "Find the area enclosed by the curve y = 6x - x^2 and the x-axis.",
         "answer": "Roots x = 0, 6. Integral of (6x - x^2) from 0 to 6 = [3x^2 - x^3/3] = "
                   "108 - 72 = 36.",
         "commentary": "Partial: correct integral with limit slips."},
        {"text": "Find the area of the region enclosed between y = x^2 and y = 2x.",
         "answer": "Intersect at x = 0, 2. Integral of (2x - x^2) from 0 to 2 = "
                   "[x^2 - x^3/3] = 4 - 8/3 = 4/3.",
         "commentary": "Subtracting the wrong way round (getting -4/3) then fixing the sign "
                       "with justification is acceptable; without justification, partial."},
    ],
    "Integration by substitution": [
        {"text": "Use the substitution u = x^2 + 1 to find the integral of x*sqrt(x^2 + 1) dx.",
         "answer": "du = 2x dx, so integral = (1/2) * integral of sqrt(u) du = (1/3)u^(3/2) + c "
                   "= (1/3)(x^2 + 1)^(3/2) + c.",
         "commentary": "Partial: correct substitution but mishandled constant factor."},
        {"text": "Evaluate the integral of x/(x^2 + 3) dx from x = 0 to x = 1.",
         "answer": "(1/2)ln(x^2 + 3) from 0 to 1 = (1/2)(ln 4 - ln 3) = (1/2)ln(4/3).",
         "commentary": "Recognising the f'/f form (or substituting u = x^2+3) earns method; "
                       "exact log form expected."},
    ],
    "Integration by parts": [
        {"text": "Find the integral of x*e^(2x) dx.",
         "answer": "u = x, dv = e^(2x)dx: (x/2)e^(2x) - (1/2) * integral of e^(2x) dx "
                   "= (x/2)e^(2x) - (1/4)e^(2x) + c.",
         "commentary": "Partial: correct parts formula, slip in the final coefficient."},
        {"text": "Use integration by parts to find the integral of ln(x) dx.",
         "answer": "u = ln x, dv = dx: x*ln(x) - integral of x*(1/x) dx = x*ln(x) - x + c.",
         "commentary": "The 'dv = dx' trick is the insight being tested."},
    ],
    "Differential equations (separation of variables)": [
        {"text": "Solve dy/dx = 2xy given y = 3 when x = 0.",
         "answer": "dy/y = 2x dx -> ln|y| = x^2 + c. y(0) = 3 gives c = ln 3. y = 3e^(x^2).",
         "commentary": "Partial: general solution correct but constant not evaluated, or "
                       "exponentiation slip."},
        {"text": "A population satisfies dN/dt = -0.1N with N(0) = 500. Find N(t) and the time for N to fall to 250.",
         "answer": "N = 500e^(-0.1t). 250 = 500e^(-0.1t) -> t = 10*ln(2) ≈ 6.93.",
         "commentary": "Both the solution and the half-time required."},
    ],

    # ---------------- PURE: Numerical Methods ----------------
    "Newton-Raphson method": [
        {"text": "Use the Newton-Raphson method with x0 = 2 to find x1 and x2 for the equation x^3 - 7 = 0. Give 4 decimal places.",
         "answer": "x(n+1) = x - (x^3-7)/(3x^2). x1 = 2 - 1/12 = 1.9167. "
                   "x2 = 1.9167 - (1.9167^3 - 7)/(3*1.9167^2) ≈ 1.9129.",
         "commentary": "Accept x2 in [1.9129, 1.9130]. Formula quoted correctly with one "
                       "arithmetic slip is partial."},
        {"text": "Apply Newton-Raphson to f(x) = x^3 + 2x - 5 with x0 = 1; find x1 and x2 (3 dp), and state when the method fails.",
         "answer": "f(1) = -2, f'(1) = 5: x1 = 1.4. f(1.4) = 0.544, f'(1.4) = 7.88: "
                   "x2 ≈ 1.331. The method fails when f'(xn) = 0 (or near 0) - horizontal "
                   "tangent never crosses the axis.",
         "commentary": "The failure condition is a required part of the answer."},
    ],
    "Fixed-point iteration": [
        {"text": "The equation x^3 - x - 2 = 0 is rearranged as x = (x + 2)^(1/3). Starting from x0 = 1.5, find x1 and x2 to 4 dp, and the root to 3 dp.",
         "answer": "x1 = 3.5^(1/3) ≈ 1.5183; x2 = 3.5183^(1/3) ≈ 1.5209. Root ≈ 1.521.",
         "commentary": "Accept small rounding differences in x1, x2; root must be 1.521."},
        {"text": "For x^2 = 2, the rearrangement x = 2/x is proposed with x0 = 1. Show the iteration fails and explain why.",
         "answer": "x1 = 2, x2 = 1, x3 = 2, ... oscillates with period 2 and never converges. "
                   "g(x) = 2/x has |g'(x)| = 2/x^2 = 1 at the root sqrt(2), and convergence "
                   "requires |g'| < 1 near the root.",
         "commentary": "Demonstrating the oscillation earns partial; the |g'| explanation "
                       "completes it."},
    ],
    "Trapezium rule": [
        {"text": "Use the trapezium rule with 4 strips to estimate the integral of sqrt(1 + x^2) from 0 to 1, to 4 dp.",
         "answer": "h = 0.25; y-values: 1, 1.0308, 1.1180, 1.25, 1.4142. "
                   "T = 0.125*(1 + 1.4142 + 2*(1.0308 + 1.1180 + 1.25)) ≈ 1.1515.",
         "commentary": "Accept 1.1514-1.1516. Using 5 strips or wrong h is method error."},
        {"text": "Estimate the integral of 1/x from 1 to 2 using the trapezium rule with 2 strips, and state with a reason whether it over- or under-estimates.",
         "answer": "h = 0.5; T = 0.25*(1 + 0.5 + 2*(2/3)) ≈ 0.7083. Overestimate: 1/x is "
                   "convex (curve bends below the chords).",
         "commentary": "The convexity reason is required for the second part."},
    ],

    # ---------------- PURE: Vectors ----------------
    "Vector arithmetic & magnitude": [
        {"text": "a = 3i + 2j and b = -i + 5j. Find |a - b|.",
         "answer": "a - b = 4i - 3j; |a - b| = sqrt(16 + 9) = 5.",
         "commentary": "Sign slip in subtraction with correct magnitude method is partial."},
        {"text": "Find the unit vector in the direction of 6i - 8j.",
         "answer": "Magnitude 10, so unit vector = 0.6i - 0.8j.",
         "commentary": "Must divide by the magnitude; leaving 6i-8j/10 unsimplified is fine."},
    ],
    "Geometric problems with vectors": [
        {"text": "Show that the points A(2, 1), B(5, 7) and C(7, 11) are collinear.",
         "answer": "AB = (3, 6), BC = (2, 4) = (2/3)AB. Parallel vectors sharing point B, "
                   "hence A, B, C collinear.",
         "commentary": "Needs both the scalar-multiple argument AND the shared point."},
        {"text": "OACB is a parallelogram with OA = a and OB = b. Prove that the diagonals OC and AB bisect each other.",
         "answer": "OC = a + b so its midpoint is (a+b)/2. Midpoint of AB = a + (b - a)/2 "
                   "= (a+b)/2. Same point, so the diagonals bisect each other.",
         "commentary": "Computing both midpoints and noting equality is the full argument."},
    ],

    # ---------------- STATISTICS ----------------
    "Sampling methods": [
        {"text": "A school of 1000 students has 250 in each of years 10-13. Describe how to take a stratified sample of 80 students, and give one advantage over simple random sampling.",
         "answer": "Sample 80*(250/1000) = 20 from each year, chosen at random within each "
                   "year (e.g. by numbering and using random numbers). Advantage: guarantees "
                   "each year group is proportionally represented.",
         "commentary": "Both the proportional calculation and the random selection within "
                       "strata are needed."},
        {"text": "A researcher surveys shoppers by stopping people outside one supermarket on a Monday morning. Name this sampling method and give two reasons the sample may be biased.",
         "answer": "Opportunity (convenience) sampling. Bias: only one location/store's "
                   "customers; only Monday-morning shoppers (excludes workers); interviewer "
                   "chooses who to approach.",
         "commentary": "Any two distinct, sensible bias reasons earn full marks."},
    ],
    "Mean, variance & standard deviation": [
        {"text": "Find the mean and standard deviation of: 2, 4, 4, 4, 5, 5, 7, 9.",
         "answer": "Mean = 40/8 = 5. Squared deviations sum to 32, variance = 4, sd = 2.",
         "commentary": "Population sd intended (divide by n). Using n-1 (≈2.14) accept as "
                       "partial with a note unless stated."},
        {"text": "Values 20, 30, 40 occur with frequencies 3, 5, 2. Find the mean and standard deviation.",
         "answer": "Mean = (60 + 150 + 80)/10 = 29. E[X^2] = (1200 + 4500 + 3200)/10 = 890. "
                   "Variance = 890 - 841 = 49, sd = 7.",
         "commentary": "The E[X^2] - mean^2 route or direct deviations both fine."},
    ],
    "Outliers, box plots & histograms": [
        {"text": "A data set has lower quartile 20 and upper quartile 32. Using the 1.5*IQR rule, decide whether the value 55 is an outlier.",
         "answer": "IQR = 12; upper fence = 32 + 1.5*12 = 50. 55 > 50, so 55 is an outlier.",
         "commentary": "Fence calculation shown explicitly for full marks."},
        {"text": "Two classes' test scores give box plots: A has median 60, IQR 10; B has median 55, IQR 25. Compare the two distributions in context.",
         "answer": "A has a higher median (typically better scores). B has a larger IQR "
                   "(more variable/spread-out scores). Comparisons must be in context.",
         "commentary": "One comparison of location AND one of spread, both in context, "
                       "for full marks."},
    ],
    "Conditional probability": [
        {"text": "P(A) = 0.5, P(B) = 0.4 and P(A and B) = 0.2. Find P(A|B) and determine whether A and B are independent.",
         "answer": "P(A|B) = 0.2/0.4 = 0.5. Since P(A|B) = P(A) (equivalently "
                   "P(A)P(B) = 0.2 = P(A and B)), A and B are independent.",
         "commentary": "Either independence test accepted; conclusion must be stated."},
        {"text": "A bag has 5 red and 3 blue counters. Two are drawn without replacement. Find P(both red) and P(second is red given the first is red).",
         "answer": "P(second red | first red) = 4/7. P(both red) = (5/8)(4/7) = 5/14.",
         "commentary": "Without-replacement denominators (8 then 7) are the tested point."},
    ],
    "Tree diagrams & combined events": [
        {"text": "Machine A makes 60% of items with 2% defective; machine B makes 40% with 5% defective. An item is picked at random. Find P(defective), and P(it came from A given it is defective).",
         "answer": "P(def) = 0.6*0.02 + 0.4*0.05 = 0.032. "
                   "P(A|def) = 0.012/0.032 = 3/8 = 0.375.",
         "commentary": "Bayes-style reversal via the tree; partial for P(def) alone."},
        {"text": "P(rain) = 0.3. If it rains, P(late) = 0.4; otherwise P(late) = 0.1. Find P(late).",
         "answer": "0.3*0.4 + 0.7*0.1 = 0.12 + 0.07 = 0.19.",
         "commentary": "Total probability over both branches."},
    ],
    "Binomial distribution": [
        {"text": "X ~ B(12, 0.25). Find P(X = 3) to 3 dp.",
         "answer": "C(12,3) * 0.25^3 * 0.75^9 = 220 * 0.015625 * 0.07508 ≈ 0.258.",
         "commentary": "Accept 0.258 ± 0.001. Formula with one arithmetic slip is partial."},
        {"text": "X ~ B(20, 0.1). Find P(X >= 3) to 3 dp.",
         "answer": "1 - P(0) - P(1) - P(2) = 1 - 0.1216 - 0.2702 - 0.2852 ≈ 0.323.",
         "commentary": "Complement method expected; accept 0.323 ± 0.002."},
    ],
    "Normal distribution": [
        {"text": "X ~ N(50, 16) (variance 16). Find P(X < 58).",
         "answer": "Z = (58-50)/4 = 2; P = 0.9772.",
         "commentary": "Watch variance vs sd: dividing by 16 instead of 4 is the classic "
                       "error (wrong)."},
        {"text": "X ~ N(mu, 25) and P(X < 70) = 0.95. Find mu to 1 dp.",
         "answer": "70 = mu + 1.6449*5 -> mu = 70 - 8.22 ≈ 61.8.",
         "commentary": "Accept 61.7-61.8 depending on z-value used (1.645)."},
    ],
    "Normal approximation to binomial": [
        {"text": "X ~ B(100, 0.5). Using a normal approximation with continuity correction, estimate P(X >= 60).",
         "answer": "Y ~ N(50, 25). P(X >= 60) ≈ P(Y > 59.5) = P(Z > 1.9) = 0.0287.",
         "commentary": "Continuity correction (59.5) required; without it (Z = 2, 0.0228) "
                       "is partial."},
        {"text": "State the conditions under which B(n, p) is well approximated by a normal distribution, and give the approximating distribution for B(400, 0.5).",
         "answer": "n large and p not close to 0 or 1 (np and n(1-p) both large, say > 5). "
                   "B(400, 0.5) ≈ N(200, 100), i.e. mean np = 200, variance np(1-p) = 100.",
         "commentary": "Both conditions and the correct N(200, 100) needed."},
    ],
    "Binomial hypothesis test": [
        {"text": "A coin is flipped 20 times and shows 15 heads. Test at the 5% level whether the coin is biased towards heads. State hypotheses, the p-value, and your conclusion.",
         "answer": "H0: p = 0.5, H1: p > 0.5. X ~ B(20, 0.5); P(X >= 15) ≈ 0.0207 < 0.05. "
                   "Reject H0: evidence at the 5% level that the coin is biased towards heads.",
         "commentary": "Full write-up needed: hypotheses, tail probability, comparison, "
                       "conclusion in context. Missing context costs the final mark."},
        {"text": "A treatment works on 30% of patients. With a new treatment, 7 of 15 patients recover. Test at the 5% level whether the new treatment is better.",
         "answer": "H0: p = 0.3, H1: p > 0.3. X ~ B(15, 0.3); P(X >= 7) = 1 - P(X <= 6) "
                   "≈ 0.131 > 0.05. Do not reject H0: insufficient evidence the new "
                   "treatment is better.",
         "commentary": "Accept p-value 0.13 ± 0.01. 'Accept H0' phrasing is weaker than "
                       "'insufficient evidence' but acceptable."},
    ],
    "Test for the mean of a normal": [
        {"text": "Scores are N(mu, 144). A sample of 36 has mean 104. Test H0: mu = 100 against H1: mu ≠ 100 at the 5% level.",
         "answer": "Sample mean ~ N(100, 144/36 = 4) under H0. Z = (104-100)/2 = 2. "
                   "Two-tailed p ≈ 0.0455 < 0.05 (or |Z| = 2 > 1.96). Reject H0.",
         "commentary": "The sd of the sample mean (sigma/sqrt(n)) is the tested concept; "
                       "using sigma = 12 unscaled is wrong method."},
        {"text": "A machine fills bottles with volume N(500, 100) ml. A sample of 25 bottles has mean 495.5 ml. Test at the 5% level whether the mean has fallen.",
         "answer": "H0: mu = 500, H1: mu < 500. Mean ~ N(500, 100/25 = 4): Z = -2.25, "
                   "p ≈ 0.0122 < 0.05. Reject H0: evidence the mean fill volume has fallen.",
         "commentary": "One-tailed; conclusion must be in context."},
    ],
    "Correlation & regression": [
        {"text": "For 10 days, ice-cream sales S (pounds) vs temperature T (Celsius) give r = 0.96 and regression line S = 25T - 100. Interpret the gradient, and comment on using the line to predict sales at T = 40.",
         "answer": "Gradient: each extra degree Celsius is associated with about 25 pounds "
                   "more sales. T = 40 is far outside the observed data range - extrapolation, "
                   "so the prediction is unreliable.",
         "commentary": "Interpretation must be in context with units; the extrapolation "
                       "caveat is the second mark."},
        {"text": "A sample of n = 10 gives PMCC r = 0.6. With critical value 0.5494 at the 5% level (one-tailed), test for positive correlation.",
         "answer": "H0: rho = 0, H1: rho > 0. r = 0.6 > 0.5494, so reject H0: evidence of "
                   "positive correlation at the 5% level.",
         "commentary": "Comparison against the critical value plus a contextual-style "
                       "conclusion."},
    ],

    # ---------------- MECHANICS ----------------
    "SUVAT problems": [
        {"text": "A car accelerates uniformly from rest to 24 m/s in 12 s. Find the acceleration and the distance travelled.",
         "answer": "a = 24/12 = 2 m/s^2. s = (1/2)(0 + 24)(12) = 144 m.",
         "commentary": "Any valid suvat route; units required."},
        {"text": "A ball is thrown vertically upwards at 14.7 m/s. Find the time to reach the highest point and the maximum height. (g = 9.8)",
         "answer": "t = 14.7/9.8 = 1.5 s. Height = 14.7*1.5 - 4.9*1.5^2 = 11.025 ≈ 11.0 m.",
         "commentary": "Accept 11.0-11.03 m. Sign convention must be consistent."},
    ],
    "Motion graphs": [
        {"text": "A train accelerates uniformly from rest to 12 m/s in 4 s, travels at 12 m/s for 6 s, then decelerates uniformly to rest in 2 s. Sketch the v-t graph and find the total distance.",
         "answer": "Trapezium areas: (1/2)(4)(12) + (6)(12) + (1/2)(2)(12) = 24 + 72 + 12 = 108 m.",
         "commentary": "Distance = area under v-t graph is the tested idea; piecewise sum."},
        {"text": "For a velocity-time graph, state what the gradient and the area under the graph represent, and find the acceleration if v rises from 5 m/s to 20 m/s over 6 s.",
         "answer": "Gradient = acceleration; area = displacement. a = (20-5)/6 = 2.5 m/s^2.",
         "commentary": "All three parts for full marks."},
    ],
    "Variable acceleration (calculus)": [
        {"text": "A particle moves with v = 3t^2 - 12t + 9 (m/s). Find the acceleration at t = 1 and the displacement from t = 0 to t = 3.",
         "answer": "a = 6t - 12; a(1) = -6 m/s^2. Displacement = [t^3 - 6t^2 + 9t] from 0 "
                   "to 3 = 27 - 54 + 27 = 0 m.",
         "commentary": "Displacement zero (it returns) - distance would differ; the question "
                       "asks displacement."},
        {"text": "A particle has acceleration a = 6t - 4 and v = 2 m/s at t = 0. Find v(t) and the velocity at t = 2.",
         "answer": "v = 3t^2 - 4t + 2. v(2) = 12 - 8 + 2 = 6 m/s.",
         "commentary": "Constant of integration from the initial condition is the method mark."},
    ],
    "Projectile motion": [
        {"text": "A stone is thrown horizontally at 20 m/s from a cliff 45 m high. Find the time to hit the sea and the horizontal distance travelled. (g = 9.8)",
         "answer": "45 = 4.9t^2 -> t = 3.03 s. Range = 20*3.03 ≈ 60.6 m.",
         "commentary": "Accept t ≈ 3.0 s, range 60-61 m. Independence of components is "
                       "the key idea."},
        {"text": "A ball is kicked at 28 m/s at 30 degrees above the horizontal from level ground. Find the time of flight and the range. (g = 9.8)",
         "answer": "uy = 14, ux = 28*cos30 ≈ 24.25. Flight time = 2*14/9.8 ≈ 2.86 s. "
                   "Range ≈ 24.25*2.86 ≈ 69.3 m.",
         "commentary": "Accept range 69-69.4 m. Resolving the components correctly is the "
                       "method mark."},
    ],
    "Newton's second law": [
        {"text": "A 1200 kg car has driving force 3000 N and total resistance 600 N. Find its acceleration.",
         "answer": "a = (3000 - 600)/1200 = 2 m/s^2.",
         "commentary": "Net force first; using 3000 alone is wrong method."},
        {"text": "A lift of mass 600 kg accelerates upwards at 0.5 m/s^2. Find the tension in the cable. (g = 9.8)",
         "answer": "T - 600g = 600*0.5 -> T = 600*(9.8 + 0.5) = 6180 N.",
         "commentary": "Sign/direction of the weight term is the tested point."},
    ],
    "Connected particles & pulleys": [
        {"text": "Masses of 5 kg and 3 kg hang from a light inextensible string over a smooth pulley. Find the acceleration and the tension. (g = 9.8)",
         "answer": "a = (5-3)g/(5+3) = 2.45 m/s^2. T = 3(g + a) = 3*12.25 = 36.75 N.",
         "commentary": "Equations of motion for each mass (or the system shortcut plus one "
                       "single-mass equation for T)."},
        {"text": "A 1000 kg car tows a 250 kg trailer. Driving force 2000 N; resistances 400 N (car) and 100 N (trailer). Find the acceleration and the tension in the towbar.",
         "answer": "System: a = (2000 - 500)/1250 = 1.2 m/s^2. Trailer alone: "
                   "T - 100 = 250*1.2 -> T = 400 N.",
         "commentary": "Partial: correct a but tension from the wrong free body."},
    ],
    "Friction & inclined planes": [
        {"text": "A 2 kg block on rough horizontal ground (mu = 0.3) is pushed by a horizontal force of 10 N. Find the acceleration. (g = 9.8)",
         "answer": "Friction = 0.3*2*9.8 = 5.88 N. a = (10 - 5.88)/2 = 2.06 m/s^2.",
         "commentary": "R = mg here because the push is horizontal; that's the tested point."},
        {"text": "A 5 kg block rests in limiting equilibrium on a rough plane inclined at 30 degrees. Find the coefficient of friction.",
         "answer": "Along plane: F = mg sin30; perpendicular: R = mg cos30. "
                   "mu = F/R = tan30 ≈ 0.577.",
         "commentary": "The mg terms cancelling to give mu = tan(theta) is the expected "
                       "insight."},
    ],
    "Moments & equilibrium": [
        {"text": "A uniform beam AB of length 4 m and mass 20 kg rests on supports at A and B. A 30 kg child stands 1 m from A. Find the reactions at A and B. (g = 9.8)",
         "answer": "Moments about A: 4*RB = 20g*2 + 30g*1 = 70g -> RB = 17.5g = 171.5 N. "
                   "RA = 50g - RB = 32.5g = 318.5 N.",
         "commentary": "Moments equation plus vertical equilibrium; check RA + RB = total "
                       "weight."},
        {"text": "A non-uniform rod of length 3 m and weight 120 N balances on a pivot 1.2 m from end A. It is then pivoted at its midpoint; what downward force at A keeps it horizontal?",
         "answer": "Centre of mass is 1.2 m from A (from the first balance). About the "
                   "midpoint: weight's moment = 120*(1.5 - 1.2) = 36 N m. Force at A: "
                   "F*1.5 = 36 -> F = 24 N.",
         "commentary": "Locating the centre of mass from the first condition is the method "
                       "mark."},
    ],
}
