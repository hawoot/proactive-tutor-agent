"""Quant Developer Prep - a second shared curriculum, for quant/dev interview
prep. Same data shape as alevel_maths_uk.py:

  PROGRAM   : the program metadata (owner_id is set by the loader/seed)
  TREE      : list of units, each with skills (atomic, masterable)
  QUESTIONS : curated bank keyed by skill name -> [{text, answer, commentary}]

Curated questions are provided only where a single canonical answer is safe to
assert; everything else is left to LLM generation (bank_first falls back to it).
Loaded into a running backend with scripts/load_quant_dev.py (idempotent)."""

PROGRAM = {
    "title": "Quant Developer Prep",
    "subject": "quant",
    "level": "interview",
    "region": "",
    "description": (
        "Interview prep for quant developer / quant researcher roles: probability, "
        "statistics, stochastic processes, linear algebra, data structures & "
        "algorithms, brainteasers, and finance basics. A broad umbrella for "
        "interleaved practice."
    ),
}

TREE = [
    {
        "title": "Probability",
        "content": "Counting, conditional probability, random variables, common distributions.",
        "skills": [
            {"name": "Combinatorics and counting", "question_type": "numeric", "effort": "quick",
             "description": "Permutations, combinations, counting with/without repetition."},
            {"name": "Conditional probability and Bayes", "question_type": "numeric", "effort": "quick",
             "description": "Conditioning, the law of total probability, Bayes' theorem, base rates."},
            {"name": "Random variables and expectation", "question_type": "numeric", "effort": "quick",
             "description": "Expectation, variance, linearity of expectation."},
            {"name": "Common distributions", "question_type": "numeric", "effort": "quick",
             "description": "Bernoulli, binomial, geometric, Poisson, uniform, normal, exponential."},
            {"name": "Expectation tricks", "question_type": "symbolic", "effort": "deep",
             "description": "Indicator variables, tail-sum formula, symmetry, conditioning to compute E[X]."},
        ],
    },
    {
        "title": "Statistics and inference",
        "content": "Estimation, MLE, regression, hypothesis testing.",
        "skills": [
            {"name": "Estimators, bias and variance", "question_type": "rubric", "effort": "deep",
             "description": "Bias, variance, MSE, the bias-variance tradeoff, consistency."},
            {"name": "Maximum likelihood estimation", "question_type": "symbolic", "effort": "deep",
             "description": "Write a likelihood, take logs, maximise; MLEs of standard families."},
            {"name": "Ordinary least squares", "question_type": "symbolic", "effort": "deep",
             "description": "Simple and multiple linear regression, the normal equations, slope/intercept."},
            {"name": "Hypothesis testing and p-values", "question_type": "rubric", "effort": "quick",
             "description": "Null/alternative, test statistic, p-value meaning, type I/II error."},
        ],
    },
    {
        "title": "Stochastic processes",
        "content": "Markov chains, random walks, Brownian motion, Ito calculus.",
        "skills": [
            {"name": "Markov chains", "question_type": "numeric", "effort": "deep",
             "description": "Transition matrices, stationary distributions, hitting/absorption times."},
            {"name": "Random walks", "question_type": "numeric", "effort": "deep",
             "description": "Symmetric/asymmetric walks, expected position, gambler's ruin."},
            {"name": "Brownian motion", "question_type": "rubric", "effort": "deep",
             "description": "Defining properties: independent Gaussian increments, continuity, variance ~ t."},
            {"name": "Ito's lemma", "question_type": "symbolic", "effort": "deep",
             "description": "Differential of f(t, X_t) for an Ito process; the second-order dt term."},
        ],
    },
    {
        "title": "Linear algebra",
        "content": "Matrices, eigen-decomposition, covariance matrices.",
        "skills": [
            {"name": "Matrix operations and rank", "question_type": "numeric", "effort": "quick",
             "description": "Multiplication, transpose/inverse, rank, linear independence."},
            {"name": "Eigenvalues and eigenvectors", "question_type": "numeric", "effort": "deep",
             "description": "Characteristic polynomial, eigenvalues/vectors, diagonalisation."},
            {"name": "Positive definiteness and covariance", "question_type": "rubric", "effort": "deep",
             "description": "Symmetric positive (semi)definite matrices; why covariance matrices are PSD."},
        ],
    },
    {
        "title": "Data structures and algorithms",
        "content": "The coding round: arrays, hashing, sorting, dynamic programming, complexity.",
        "skills": [
            {"name": "Arrays and two pointers", "question_type": "code", "effort": "deep",
             "description": "Two-pointer and sliding-window patterns on sequences."},
            {"name": "Hash maps", "question_type": "code", "effort": "quick",
             "description": "O(1) lookup patterns: dedupe, frequency counts, complement search."},
            {"name": "Sorting and complexity", "question_type": "numeric", "effort": "quick",
             "description": "Comparison sorts, their time/space complexity, stability."},
            {"name": "Dynamic programming", "question_type": "code", "effort": "deep",
             "description": "Overlapping subproblems, memoisation vs tabulation, classic recurrences."},
            {"name": "Big-O analysis", "question_type": "rubric", "effort": "quick",
             "description": "Asymptotic time/space complexity of code; best/average/worst case."},
        ],
    },
    {
        "title": "Brainteasers and finance basics",
        "content": "Expected-value puzzles, strategy, estimation, and core finance maths.",
        "skills": [
            {"name": "Expected value puzzles", "question_type": "numeric", "effort": "deep",
             "description": "Classic EV brainteasers: dice games, optional stopping, fair prices."},
            {"name": "Estimation (Fermi)", "question_type": "rubric", "effort": "quick",
             "description": "Order-of-magnitude estimates from sensible assumptions."},
            {"name": "Discounting and present value", "question_type": "numeric", "effort": "quick",
             "description": "Time value of money: present/future value, simple and compound interest."},
            {"name": "Option pricing intuition", "question_type": "rubric", "effort": "deep",
             "description": "Payoffs, no-arbitrage, risk-neutral intuition, Black-Scholes inputs."},
        ],
    },
]

QUESTIONS = {
    "Combinatorics and counting": [
        {"text": "How many distinct arrangements are there of the letters in the word LEVEL?",
         "answer": "30. There are 5 letters with L and E each repeated twice: 5! / (2! * 2!) = 120 / 4 = 30.",
         "commentary": "Award full credit for 5!/(2!2!) = 30. Common slip: forgetting to divide by repeats (5! = 120)."},
        {"text": "From 10 people, how many ways can you choose a committee of 3 (order doesn't matter)?",
         "answer": "C(10,3) = 10! / (3! * 7!) = 120.",
         "commentary": "Combination, not permutation. 120 is correct; 720 means they used permutations."},
    ],
    "Conditional probability and Bayes": [
        {"text": "A disease affects 1% of a population. A test is 99% sensitive (P(positive|disease)=0.99) "
                 "and 95% specific (P(negative|no disease)=0.95). Given a positive test, what is the probability "
                 "the person has the disease? Round to the nearest percent.",
         "answer": "About 17%. P(D|+) = (0.99*0.01) / (0.99*0.01 + 0.05*0.99) = 0.0099 / 0.0594 ≈ 0.167 ≈ 17%.",
         "commentary": "The base-rate point. Full credit ~16-17%. A high answer (e.g. 99%) ignores the 1% prevalence."},
    ],
    "Random variables and expectation": [
        {"text": "A fair six-sided die is rolled once. What is the expected value of the number shown?",
         "answer": "3.5 = (1+2+3+4+5+6)/6 = 21/6 = 3.5.",
         "commentary": "Straightforward mean of a discrete uniform. 3.5 exactly."},
        {"text": "A fair coin is flipped 10 times. What is the expected number of heads?",
         "answer": "5. By linearity of expectation, E = 10 * 0.5 = 5.",
         "commentary": "Linearity of expectation; no independence needed. 5 is correct."},
    ],
    "Common distributions": [
        {"text": "X ~ Binomial(n=5, p=0.5). What is P(X = 2)?",
         "answer": "0.3125. P(X=2) = C(5,2) * 0.5^2 * 0.5^3 = 10 * (1/32) = 10/32 = 0.3125.",
         "commentary": "10/32 = 0.3125. Accept the fraction or the decimal."},
    ],
    "Expectation tricks": [
        {"text": "What is the expected number of flips of a fair coin until the first head appears?",
         "answer": "2. The count is Geometric(p=0.5), so E = 1/p = 1/0.5 = 2.",
         "commentary": "Geometric expectation 1/p, or the recurrence E = 1 + 0.5E. Answer 2."},
    ],
    "Maximum likelihood estimation": [
        {"text": "You observe k successes in n independent Bernoulli(p) trials. What is the maximum "
                 "likelihood estimate of p?",
         "answer": "p_hat = k/n. Maximise the log-likelihood k ln p + (n-k) ln(1-p): derivative k/p - (n-k)/(1-p) = 0 gives p = k/n.",
         "commentary": "The sample proportion k/n. Full method (log-likelihood, derivative, solve) earns full marks."},
    ],
    "Ordinary least squares": [
        {"text": "In simple linear regression y = a + b*x fit by least squares, give the formula for the slope b.",
         "answer": "b = Cov(x, y) / Var(x) = sum((x_i - xbar)(y_i - ybar)) / sum((x_i - xbar)^2).",
         "commentary": "Either the covariance/variance form or the sum form is correct."},
    ],
    "Random walks": [
        {"text": "A symmetric random walk starts at 0 and each step is +1 or -1 with equal probability. "
                 "What is the expected position after n steps?",
         "answer": "0. Each step has mean 0, so by linearity the expected position is 0 for any n (the variance is n).",
         "commentary": "Expected position 0; bonus if they note variance grows like n."},
    ],
    "Matrix operations and rank": [
        {"text": "What is the rank of the matrix [[1, 2], [2, 4]]?",
         "answer": "1. The second row is twice the first, so the rows are linearly dependent: rank = 1.",
         "commentary": "Rank 1 (one independent row). Rank 2 misses the dependence."},
    ],
    "Eigenvalues and eigenvectors": [
        {"text": "What are the eigenvalues of the matrix [[2, 0], [0, 3]]?",
         "answer": "2 and 3. A diagonal matrix has its diagonal entries as eigenvalues.",
         "commentary": "Diagonal => eigenvalues are the diagonal. 2 and 3."},
    ],
    "Sorting and complexity": [
        {"text": "What is the average-case time complexity of quicksort on n elements?",
         "answer": "O(n log n) on average (worst case O(n^2) with poor pivots).",
         "commentary": "O(n log n) average. Credit the worst-case note but the asked answer is average."},
        {"text": "What is the worst-case time complexity of binary search on a sorted array of n elements?",
         "answer": "O(log n), because the search interval halves each step.",
         "commentary": "O(log n). O(n) would be linear search."},
    ],
    "Dynamic programming": [
        {"text": "You can climb a staircase 1 or 2 steps at a time. How many distinct ways are there to climb "
                 "5 steps?",
         "answer": "8. The count satisfies the Fibonacci recurrence f(n)=f(n-1)+f(n-2): f(1)=1, f(2)=2, f(3)=3, "
                   "f(4)=5, f(5)=8.",
         "commentary": "Fibonacci. f(5)=8. Accept a correct recurrence + value."},
    ],
    "Big-O analysis": [
        {"text": "Two nested loops each run from 1 to n, doing O(1) work inside. What is the time complexity?",
         "answer": "O(n^2), since the inner body runs n * n times.",
         "commentary": "O(n^2). Conceptual rubric: it's the product of the loop bounds."},
    ],
    "Expected value puzzles": [
        {"text": "You may roll a fair six-sided die once and are paid, in dollars, the number you roll. "
                 "What is the fair price to play this game once?",
         "answer": "$3.50, the expected payout E = (1+2+3+4+5+6)/6 = 3.5.",
         "commentary": "Fair price = expected value = 3.5. (Extends to the 're-roll' variant, E=4.25, but not asked here.)"},
    ],
    "Discounting and present value": [
        {"text": "What is the present value of $100 received one year from now, at an annual discount rate of 5%?",
         "answer": "About $95.24 = 100 / 1.05 ≈ 95.238.",
         "commentary": "PV = FV/(1+r). ~$95.24. Compounding/period errors lose credit."},
    ],
}
