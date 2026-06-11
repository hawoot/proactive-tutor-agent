"""UK A-level Mathematics - full two-year course, exam-board neutral
(covers the common core of AQA / Edexcel / OCR).

Structure: three strands (Pure, Statistics, Mechanics) -> topic units with
material notes -> skills. Skill fields: name, description (context for the
question generator), question_type (numeric|symbolic|mcq|code|rubric),
effort (quick = phone-friendly, deep = pen-and-paper).
"""

PROGRAM = {
    "title": "A-level Maths (UK)",
    "subject": "maths",
    "level": "A-level",
    "region": "UK",
    "status": "published",
    "description": (
        "Full UK A-level Mathematics: Pure (proof, algebra, functions, "
        "coordinate geometry, sequences and series, trigonometry, exponentials "
        "and logarithms, calculus, numerical methods, vectors), Statistics "
        "(sampling, probability, distributions, hypothesis testing) and "
        "Mechanics (kinematics, forces, moments). Exam-board neutral."
    ),
}


def _skill(name, description="", question_type="numeric", effort="quick"):
    return {"name": name, "description": description,
            "question_type": question_type, "effort": effort}


TREE = [
    {
        "title": "Pure Mathematics",
        "content": "The core strand: algebraic fluency, functions, calculus and proof. "
                   "Roughly two thirds of the final assessment.",
        "children": [
            {
                "title": "Proof",
                "content": "Proof by deduction, proof by exhaustion, disproof by counterexample, "
                           "proof by contradiction. Classics to know: sqrt(2) is irrational; there are "
                           "infinitely many primes. Structure: state assumptions, derive a contradiction, "
                           "conclude.",
                "skills": [
                    _skill("Proof by contradiction",
                           "e.g. irrationality proofs, infinitude of primes; assess structure and rigour.",
                           "rubric", "deep"),
                    _skill("Disproof by counterexample",
                           "Find a single case that breaks a general claim about integers/functions.",
                           "rubric", "quick"),
                ],
            },
            {
                "title": "Algebra & Functions",
                "content": "Indices and surds; quadratics (completing the square, discriminant); "
                           "simultaneous equations; linear and quadratic inequalities; polynomial division "
                           "and the factor theorem; partial fractions; the modulus function; composite and "
                           "inverse functions; graph transformations y = af(bx + c) + d.",
                "skills": [
                    _skill("Laws of indices & surds",
                           "Simplify, rationalise denominators, solve index equations."),
                    _skill("Completing the square",
                           "Vertex form, max/min of quadratics, deriving the quadratic formula.",
                           "symbolic"),
                    _skill("Quadratic & linear inequalities",
                           "Solve and express solution sets; sketch regions; discriminant conditions.",
                           "symbolic"),
                    _skill("Polynomial division & factor theorem",
                           "Divide polynomials, find unknown coefficients, fully factorise cubics.",
                           "symbolic"),
                    _skill("Partial fractions",
                           "Proper/improper fractions with distinct or repeated linear factors.",
                           "symbolic"),
                    _skill("Functions: composite, inverse & modulus",
                           "Domain/range, ff^-1, sketching y=|f(x)| and solving modulus equations.",
                           "symbolic", "deep"),
                ],
            },
            {
                "title": "Coordinate Geometry",
                "content": "Straight lines: gradient, parallel/perpendicular, distance and midpoint. "
                           "Circles: (x-a)^2 + (y-b)^2 = r^2, tangents and chords, the perpendicular from "
                           "the centre. Parametric equations and conversion to Cartesian form.",
                "skills": [
                    _skill("Straight line equations",
                           "Through two points, perpendicular bisectors, intersections."),
                    _skill("Circle equations & tangents",
                           "Complete the square to find centre/radius; tangent and normal lines.",
                           "symbolic"),
                    _skill("Parametric equations",
                           "Convert parametric to Cartesian; points of intersection; parametric differentiation.",
                           "symbolic"),
                ],
            },
            {
                "title": "Sequences & Series",
                "content": "Binomial expansion of (a+bx)^n for positive integer n and rational n "
                           "(validity |bx/a|<1). Arithmetic and geometric sequences and series; sum to "
                           "infinity for |r|<1. Sigma notation. Recurrence relations; increasing, "
                           "decreasing and periodic sequences.",
                "skills": [
                    _skill("Binomial expansion",
                           "Integer and fractional/negative powers; range of validity; approximations."),
                    _skill("Arithmetic sequences & series",
                           "nth term, sum formulas, problems with simultaneous conditions."),
                    _skill("Geometric sequences & series",
                           "nth term, S_n, sum to infinity, convergence condition."),
                    _skill("Recurrence relations",
                           "Compute terms, identify behaviour (increasing/decreasing/periodic)."),
                ],
            },
            {
                "title": "Trigonometry",
                "content": "Exact values; sine and cosine rules; radians, arc length and sector area. "
                           "Identities: sin^2 + cos^2 = 1, tan = sin/cos, sec/cosec/cot versions. "
                           "Solving equations in a given interval. Addition and double-angle formulae; "
                           "R sin(x + a) form; small-angle approximations; inverse trig functions.",
                "skills": [
                    _skill("Trig equations in an interval",
                           "Solve sin/cos/tan equations in degrees or radians, all solutions in range."),
                    _skill("Trig identities",
                           "Prove identities using Pythagorean and quotient identities.",
                           "symbolic"),
                    _skill("Addition & double angle formulae",
                           "Expand, simplify, solve equations requiring compound-angle work.",
                           "symbolic"),
                    _skill("R-alpha form",
                           "Write a sin x + b cos x as R sin(x + alpha); max/min and equation solving.",
                           "symbolic", "deep"),
                    _skill("Radians, arcs & sectors",
                           "Arc length r*theta, sector area (1/2)r^2*theta, segment problems."),
                ],
            },
            {
                "title": "Exponentials & Logarithms",
                "content": "y = a^x and y = e^x; the laws of logarithms; ln as inverse of e^x; "
                           "solving a^x = b; reduction of relationships to linear form using logs; "
                           "exponential growth and decay modelling.",
                "skills": [
                    _skill("Laws of logarithms",
                           "Combine/split logs, solve log equations, change of base."),
                    _skill("Exponential equations",
                           "Solve a^x = b and equations quadratic in e^x.",
                           "symbolic"),
                    _skill("Exponential modelling",
                           "Growth/decay problems: half-life, initial value, interpreting parameters.",
                           "rubric", "deep"),
                ],
            },
            {
                "title": "Differentiation",
                "content": "Derivative as gradient and limit (first principles for x^n, sin, cos). "
                           "Rules: power, product, quotient, chain. Derivatives of e^x, ln x, trig. "
                           "Tangents and normals; increasing/decreasing; stationary points and their "
                           "nature; points of inflection. Implicit and parametric differentiation; "
                           "connected rates of change; optimisation.",
                "skills": [
                    _skill("Differentiation rules",
                           "Product, quotient and chain rule on polynomial/trig/exp functions.",
                           "symbolic"),
                    _skill("Differentiation from first principles",
                           "Limit definition applied to small polynomials and sin/cos.",
                           "symbolic", "deep"),
                    _skill("Stationary points & curve sketching",
                           "Find and classify stationary points; increasing/decreasing intervals.",
                           "symbolic"),
                    _skill("Implicit differentiation",
                           "dy/dx for curves like x^2 + xy + y^2 = k; tangents at a point.",
                           "symbolic"),
                    _skill("Optimisation problems",
                           "Set up a model (area/volume/cost), differentiate, justify max/min.",
                           "rubric", "deep"),
                    _skill("Connected rates of change",
                           "Chain rule across related variables, e.g. expanding sphere problems.",
                           "numeric", "deep"),
                ],
            },
            {
                "title": "Integration",
                "content": "Integration as antiderivative and as area; standard integrals including "
                           "1/x, e^x, trig. Definite integrals; area under and between curves. "
                           "Integration by substitution and by parts; using partial fractions. "
                           "Differential equations by separation of variables.",
                "skills": [
                    _skill("Standard integrals",
                           "Power rule, 1/x, exponentials and trig; don't forget + c.",
                           "symbolic"),
                    _skill("Areas under & between curves",
                           "Definite integrals, regions between two curves, negative regions."),
                    _skill("Integration by substitution",
                           "Choose a substitution, transform limits, evaluate.",
                           "symbolic", "deep"),
                    _skill("Integration by parts",
                           "x e^x, x sin x, ln x; repeated application.",
                           "symbolic", "deep"),
                    _skill("Differential equations (separation of variables)",
                           "Separate, integrate, apply initial conditions, interpret the model.",
                           "symbolic", "deep"),
                ],
            },
            {
                "title": "Numerical Methods",
                "content": "Locating roots by change of sign; fixed-point iteration x = g(x) and "
                           "convergence (staircase/cobweb); the Newton-Raphson method and its failure "
                           "cases; the trapezium rule with over/under-estimate analysis.",
                "skills": [
                    _skill("Newton-Raphson method",
                           "Iterate to a stated accuracy; explain failure when f'(x) ~ 0."),
                    _skill("Fixed-point iteration",
                           "Rearrange f(x)=0 to x=g(x), iterate, comment on convergence."),
                    _skill("Trapezium rule",
                           "Estimate definite integrals; decide over- or under-estimate from concavity."),
                ],
            },
            {
                "title": "Vectors",
                "content": "Vectors in 2D and 3D: magnitude, direction, unit vectors, i-j-k notation. "
                           "Position vectors, midpoints, ratios on a line segment. Using vectors to "
                           "prove geometric facts (parallel, collinear).",
                "skills": [
                    _skill("Vector arithmetic & magnitude",
                           "Add/scale vectors, magnitude and direction, unit vectors, distances."),
                    _skill("Geometric problems with vectors",
                           "Collinearity, ratios, midpoints; prove quadrilateral properties.",
                           "symbolic", "deep"),
                ],
            },
        ],
    },
    {
        "title": "Statistics",
        "content": "Working with data and probability models, including the use of a large data set.",
        "children": [
            {
                "title": "Sampling & Data Presentation",
                "content": "Sampling: simple random, systematic, stratified, quota, opportunity - and "
                           "their biases. Measures of location and spread: mean, median, quartiles, "
                           "variance, standard deviation. Outliers (1.5 IQR and 2 s.d. rules), box plots, "
                           "histograms, cumulative frequency, data cleaning.",
                "skills": [
                    _skill("Sampling methods",
                           "Choose and critique a sampling method for a scenario.",
                           "rubric"),
                    _skill("Mean, variance & standard deviation",
                           "From raw data and frequency tables, including coded data."),
                    _skill("Outliers, box plots & histograms",
                           "Identify outliers, interpret and compare distributions."),
                ],
            },
            {
                "title": "Probability",
                "content": "Venn diagrams, tree diagrams, two-way tables. Mutually exclusive and "
                           "independent events. Conditional probability: P(A|B) = P(A and B)/P(B).",
                "skills": [
                    _skill("Conditional probability",
                           "Venn/tree/table problems; test for independence."),
                    _skill("Tree diagrams & combined events",
                           "Multi-stage experiments with and without replacement."),
                ],
            },
            {
                "title": "Distributions",
                "content": "Discrete random variables and the binomial distribution B(n, p): conditions, "
                           "calculations, cumulative probabilities. The normal distribution N(mu, sigma^2): "
                           "standardising, inverse problems, finding mu/sigma. Normal approximation to the "
                           "binomial with continuity correction.",
                "skills": [
                    _skill("Binomial distribution",
                           "Model checking, exact and cumulative probabilities, finding n or p."),
                    _skill("Normal distribution",
                           "Standardise, use tables/calculator, inverse normal, find unknown mu/sigma."),
                    _skill("Normal approximation to binomial",
                           "When valid; continuity correction; compare with exact value.",
                           "numeric", "deep"),
                ],
            },
            {
                "title": "Hypothesis Testing",
                "content": "Null/alternative hypotheses, significance level, one vs two tailed, critical "
                           "regions, p-values, conclusions in context. Tests: binomial proportion, mean of "
                           "a normal distribution, and zero correlation (PMCC).",
                "skills": [
                    _skill("Binomial hypothesis test",
                           "Full test write-up: hypotheses, critical region or p-value, conclusion in context.",
                           "rubric", "deep"),
                    _skill("Test for the mean of a normal",
                           "Use the distribution of the sample mean; one and two tailed.",
                           "rubric", "deep"),
                    _skill("Correlation & regression",
                           "Interpret PMCC and regression coefficients; test for zero correlation.",
                           "rubric"),
                ],
            },
        ],
    },
    {
        "title": "Mechanics",
        "content": "Modelling motion and forces. Assumptions matter: particle, light string, "
                   "smooth pulley, inextensible.",
        "children": [
            {
                "title": "Kinematics",
                "content": "Displacement/velocity/acceleration; suvat equations for constant "
                           "acceleration; velocity-time and displacement-time graphs; variable "
                           "acceleration via differentiation/integration; projectile motion (independent "
                           "horizontal and vertical components).",
                "skills": [
                    _skill("SUVAT problems",
                           "Constant acceleration in one dimension, including vertical motion under gravity."),
                    _skill("Motion graphs",
                           "Read/draw v-t and s-t graphs; areas and gradients."),
                    _skill("Variable acceleration (calculus)",
                           "Differentiate/integrate between s, v and a; max velocity, distance travelled.",
                           "symbolic"),
                    _skill("Projectile motion",
                           "Time of flight, range, maximum height, velocity at a point.",
                           "numeric", "deep"),
                ],
            },
            {
                "title": "Forces & Newton's Laws",
                "content": "Force diagrams, resultant force, F = ma in one and two dimensions. Weight, "
                           "normal reaction, tension, thrust, friction F <= mu R. Connected particles "
                           "(pulleys, tow bars); motion on rough and smooth inclined planes.",
                "skills": [
                    _skill("Newton's second law",
                           "Single-particle problems, resolve forces, find acceleration or force."),
                    _skill("Connected particles & pulleys",
                           "Two-body systems: equations of motion for each body, tension, after-string-breaks.",
                           "numeric", "deep"),
                    _skill("Friction & inclined planes",
                           "Resolve along/perpendicular to plane; limiting equilibrium; mu calculations.",
                           "numeric", "deep"),
                ],
            },
            {
                "title": "Moments",
                "content": "Moment = force x perpendicular distance. Equilibrium of rigid bodies: "
                           "beams on supports, tilting conditions, non-uniform rods (centre of mass).",
                "skills": [
                    _skill("Moments & equilibrium",
                           "Beam problems: reactions at supports, tilting point, non-uniform rods."),
                ],
            },
        ],
    },
]
