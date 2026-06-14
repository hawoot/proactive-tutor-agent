"""Quant Developer Prep - a from-scratch, practical, INTERVIEW-style curriculum
for quant *developer* roles (not quant researcher): C++ and Python are the deep
end; probability and finance are basics only. Heavy on traps / "what does this
print" / "spot the bug", which is where dev interviews actually live.

Data shape (consumed by app/seed.py):
  PROGRAM   : program metadata (owner_id set by the seeder)
  TREE      : list of units -> skills (each skill: name, kind, description)
  QUESTIONS : {skill name: [{text, answer, commentary, mode, style}]}
              mode  = on_the_go | short_drill | problem
              style = trap | misconception | true_false | concept | mcq | example  (on-the-go flavour)

Curated answers only where a single canonical answer is safe; generation fills
the rest (bank_first). Problem answers spell out the steps."""

PROGRAM = {
    "title": "Quant Developer Prep",
    "subject": "quant-dev",
    "level": "interview",
    "region": "",
    "description": (
        "Practical interview prep for quant developer roles: C++ (foundations -> "
        "advanced), Python (refreshers -> advanced), plus basics of probability, "
        "brain teasers and finance. Trap-forward and code-reading heavy, not academic."
    ),
}

# kinds: code | stats | math | concept  (a hint for the question generator)
TREE = [
    {
        "title": "C++ · Foundations",
        "content": "The basics you must be solid on before anything else: value/reference/"
                   "pointer semantics, const, RAII, and the STL containers.",
        "skills": [
            {"name": "C++ value, reference and pointer semantics", "kind": "code",
             "description": "Pass/return by value vs reference vs pointer; copies; dangling."},
            {"name": "C++ const and const-correctness", "kind": "code",
             "description": "const variables, const references, const member functions, const pointers."},
            {"name": "C++ RAII and object lifetime", "kind": "code",
             "description": "Construction/destruction order, scope, stack vs heap, ownership."},
            {"name": "C++ STL containers: choosing one", "kind": "code",
             "description": "vector vs list vs map vs unordered_map; complexity and memory."},
            {"name": "C++ iterator invalidation", "kind": "code",
             "description": "Which container operations invalidate iterators/pointers/references."},
        ],
    },
    {
        "title": "C++ · Intermediate",
        "content": "Move semantics, smart pointers, templates and lambdas - the everyday "
                   "modern-C++ toolkit.",
        "skills": [
            {"name": "C++ copy vs move semantics", "kind": "code",
             "description": "lvalues/rvalues, std::move, move ctors, when moves happen."},
            {"name": "C++ smart pointers", "kind": "code",
             "description": "unique_ptr, shared_ptr, weak_ptr; ownership, cycles, overhead."},
            {"name": "C++ rule of 0/3/5", "kind": "code",
             "description": "When to write/delete/default special members; resource classes."},
            {"name": "C++ templates and overload resolution", "kind": "code",
             "description": "Function/class templates, deduction, overloading vs specialisation."},
            {"name": "C++ lambdas and std::function", "kind": "code",
             "description": "Captures (value/ref), mutable, closures, std::function cost."},
        ],
    },
    {
        "title": "C++ · Advanced (quant-dev)",
        "content": "Where low-latency quant dev lives: undefined behaviour, the memory "
                   "hierarchy, dispatch cost, and concurrency.",
        "skills": [
            {"name": "C++ undefined behaviour", "kind": "code",
             "description": "Signed overflow, OOB, use-after-free, uninitialised reads, strict aliasing."},
            {"name": "C++ cache and memory layout", "kind": "code",
             "description": "Cache lines, locality, AoS vs SoA, false sharing, prefetch."},
            {"name": "C++ virtual dispatch cost", "kind": "code",
             "description": "vtables, indirection, inlining, devirtualisation on the hot path."},
            {"name": "C++ concurrency: races and memory order", "kind": "code",
             "description": "Data races, atomics, memory_order, mutexes, lock-free basics."},
            {"name": "C++ low-latency idioms", "kind": "code",
             "description": "Avoiding allocation on the hot path, reserve, noexcept, branch hints."},
        ],
    },
    {
        "title": "Python · Foundations & refreshers",
        "content": "Close the gaps: the data model, the classic gotchas, and the features "
                   "you benefit from refreshing (context managers, decorators, typing).",
        "skills": [
            {"name": "Python mutability and the data model", "kind": "code",
             "description": "References, identity vs equality, mutable vs immutable, aliasing."},
            {"name": "Python default mutable arguments", "kind": "code",
             "description": "The def-time evaluation gotcha and the correct pattern."},
            {"name": "Python comprehensions", "kind": "code",
             "description": "List/dict/set/generator comprehensions; scope; when to use which."},
            {"name": "Python context managers", "kind": "code",
             "description": "with, __enter__/__exit__, contextlib, resource safety."},
            {"name": "Python decorators", "kind": "code",
             "description": "Wrapping functions, functools.wraps, arguments, common uses."},
            {"name": "Python typing and annotations", "kind": "code",
             "description": "Type hints, Optional, generics, runtime vs static, mypy basics."},
        ],
    },
    {
        "title": "Python · Advanced (quant-dev)",
        "content": "The most important section: generators, the GIL, numpy/pandas, and "
                   "performance - the things a quant dev is actually expected to nail.",
        "skills": [
            {"name": "Python generators and lazy evaluation", "kind": "code",
             "description": "yield, iterators vs iterables, generator state, memory wins."},
            {"name": "Python the GIL: threads vs processes", "kind": "code",
             "description": "Why threads don't speed up CPU-bound code; multiprocessing; I/O."},
            {"name": "Python numpy vectorization", "kind": "code",
             "description": "Vectorised ops vs loops, broadcasting, dtypes, ufuncs."},
            {"name": "Python pandas idioms", "kind": "code",
             "description": "Vectorised columns, groupby, avoiding apply/iterrows, alignment."},
            {"name": "Python views vs copies", "kind": "code",
             "description": "numpy/pandas slicing returns views or copies; SettingWithCopy."},
            {"name": "Python performance and profiling", "kind": "code",
             "description": "Big-O, time/space, cProfile/timeit, where Python is slow."},
        ],
    },
    {
        "title": "Probability (basics)",
        "content": "Dev-level probability - the staples, not research depth.",
        "skills": [
            {"name": "Counting and combinatorics", "kind": "stats",
             "description": "Permutations, combinations, with/without repetition."},
            {"name": "Conditional probability and Bayes", "kind": "stats",
             "description": "Conditioning, total probability, Bayes, base rates."},
            {"name": "Expectation and linearity", "kind": "stats",
             "description": "E[X], variance, linearity of expectation, indicators."},
            {"name": "Common distributions", "kind": "stats",
             "description": "Bernoulli, binomial, geometric, Poisson, uniform, normal."},
        ],
    },
    {
        "title": "Brain teasers",
        "content": "Classic quant interview puzzles: expected value, estimation, and logic.",
        "skills": [
            {"name": "Expected-value games", "kind": "math",
             "description": "Fair prices, optional stopping, dice/coin games."},
            {"name": "Estimation (Fermi)", "kind": "concept",
             "description": "Order-of-magnitude estimates from sensible assumptions."},
            {"name": "Logic puzzles", "kind": "concept",
             "description": "Weighings, switches, hat puzzles, classic lateral teasers."},
        ],
    },
    {
        "title": "Finance (basics)",
        "content": "Dev-level finance literacy - enough to be conversant, not a QR.",
        "skills": [
            {"name": "Time value of money", "kind": "stats",
             "description": "Present/future value, discounting, simple vs compound interest."},
            {"name": "Option payoffs", "kind": "concept",
             "description": "Call/put payoffs at expiry, intrinsic value, long vs short."},
            {"name": "No-arbitrage intuition", "kind": "concept",
             "description": "Law of one price, replication, put-call parity intuition."},
            {"name": "What the Greeks mean", "kind": "concept",
             "description": "Delta, gamma, theta, vega - conceptual, not formulae."},
        ],
    },
]


def _t(text, answer, commentary, mode, style=""):
    return {"text": text, "answer": answer, "commentary": commentary, "mode": mode, "style": style}


QUESTIONS = {
    # ---------------- C++ Foundations ----------------
    "C++ value, reference and pointer semantics": [
        _t("True or false: passing a large std::vector to `void f(std::vector<int> v)` "
           "copies the whole vector.",
           "True. The parameter is by value, so the entire vector (all elements) is copied. "
           "Use `const std::vector<int>&` to avoid the copy.",
           "The fix - pass by const reference - is the point. Award full credit for spotting the copy.",
           "on_the_go", "trap"),
        _t("What does this print?\n  int a = 5;\n  int& r = a;\n  r = 10;\n  std::cout << a;",
           "10. r is a reference (alias) to a, so assigning through r changes a.",
           "References are aliases, not copies. 5 means they think r is a separate variable.",
           "on_the_go", "trap"),
        _t("Why is returning a reference/pointer to a local variable a bug?\n"
           "  int& f() { int x = 42; return x; }",
           "x is destroyed when f returns, so the returned reference dangles - using it is "
           "undefined behaviour.",
           "Lifetime ends at scope exit. Return by value instead.",
           "on_the_go", "trap"),
    ],
    "C++ const and const-correctness": [
        _t("True or false: in `const int* p`, you cannot change `p` to point elsewhere.",
           "False. `const int* p` means the pointed-to int is const; `p` itself can be "
           "reassigned. `int* const p` is the one that fixes the pointer.",
           "Read right-to-left: 'p is a pointer to const int'. Classic const-placement trap.",
           "on_the_go", "trap"),
        _t("Why should a getter like `int size() const` be marked const?",
           "So it can be called on const objects and promises not to modify the object; it "
           "documents and enforces that the method is read-only.",
           "const-correctness propagates: a const& parameter can only call const methods.",
           "on_the_go", "concept"),
    ],
    "C++ RAII and object lifetime": [
        _t("In what order are local objects destroyed at the end of a scope?",
           "Reverse order of construction (last constructed is destroyed first).",
           "LIFO destruction underpins RAII and exception safety.",
           "on_the_go", "concept"),
        _t("What is RAII and what problem does it solve?",
           "Resource Acquisition Is Initialization: tie a resource (memory, file, lock) to an "
           "object's lifetime so its destructor always releases it - even on early return or "
           "exception. It solves leaks and manual cleanup.",
           "The 'even on exception' part is the key benefit.",
           "short_drill", ""),
    ],
    "C++ STL containers: choosing one": [
        _t("You need O(1) average lookup by key and don't care about ordering. "
           "std::map or std::unordered_map?",
           "std::unordered_map (hash table, O(1) average). std::map is a balanced tree, "
           "O(log n) and kept sorted.",
           "Pick unordered_map for speed, map when you need sorted iteration.",
           "on_the_go", "mcq"),
        _t("True or false: std::vector stores its elements contiguously in memory.",
           "True - which is why it's cache-friendly and supports O(1) random access. "
           "std::list does not (nodes scattered).",
           "Contiguity is the main reason vector is the default container.",
           "on_the_go", "true_false"),
    ],
    "C++ iterator invalidation": [
        _t("After `v.push_back(x)` on a std::vector, are existing iterators still valid?",
           "Not necessarily: if push_back triggers a reallocation (size exceeds capacity), ALL "
           "iterators, pointers and references into the vector are invalidated.",
           "This is a top-tier C++ trap. `reserve()` up front avoids reallocation.",
           "on_the_go", "trap"),
        _t("What does this loop risk?\n  for (auto it = v.begin(); it != v.end(); ++it)\n"
           "    if (*it == 0) v.erase(it);",
           "erase invalidates `it` (and everything after it); ++it then uses an invalid "
           "iterator -> undefined behaviour. Correct: `it = v.erase(it);` and only ++ when not erasing.",
           "erase returns the next valid iterator - use it.",
           "on_the_go", "trap"),
    ],
    # ---------------- C++ Intermediate ----------------
    "C++ copy vs move semantics": [
        _t("True or false: `std::move(x)` moves x.",
           "False. std::move does nothing at runtime - it's a cast to an rvalue reference. The "
           "actual move happens when a move constructor/assignment is then selected.",
           "Huge interview favourite. It only *enables* a move.",
           "on_the_go", "trap"),
        _t("After `auto b = std::move(a);` where a is a std::vector, what is the state of a?",
           "a is left in a valid but unspecified state (typically empty). You may assign to it "
           "or destroy it, but shouldn't assume its contents.",
           "'Valid but unspecified' is the precise phrase.",
           "on_the_go", "concept"),
    ],
    "C++ smart pointers": [
        _t("Two std::shared_ptr objects own each other (a cycle). What happens?",
           "A reference-count cycle: neither count reaches zero, so the objects are never "
           "freed - a memory leak. Break it with std::weak_ptr for the back-reference.",
           "shared_ptr cycles are the classic leak; weak_ptr is the fix.",
           "on_the_go", "trap"),
        _t("When would you choose unique_ptr over shared_ptr?",
           "When there is a single, exclusive owner (the common case). unique_ptr has zero "
           "overhead vs a raw pointer; shared_ptr carries an atomic reference count.",
           "Default to unique_ptr; reach for shared_ptr only when ownership is genuinely shared.",
           "short_drill", ""),
    ],
    "C++ rule of 0/3/5": [
        _t("What is the 'Rule of Zero'?",
           "Design classes so they need no user-declared destructor, copy/move ctor or "
           "copy/move assignment - let members (e.g. smart pointers, vector) manage resources. "
           "Then the compiler-generated specials are correct.",
           "Rule of Zero is the modern default; Rule of 3/5 is for genuine resource owners.",
           "short_drill", ""),
        _t("If a class manages a raw resource and you write a destructor, what else must you "
           "usually handle?",
           "Copy constructor and copy assignment (Rule of 3) - and ideally move constructor and "
           "move assignment too (Rule of 5) - otherwise default copies double-free or leak.",
           "The danger is a shallow copy of an owning raw pointer -> double free.",
           "on_the_go", "concept"),
    ],
    "C++ templates and overload resolution": [
        _t("True or false: template code is fully type-checked even if never instantiated.",
           "False. A template is only fully checked when instantiated with concrete types; "
           "errors in an uninstantiated template path can go unnoticed.",
           "Two-phase lookup nuance; instantiation is when most errors surface.",
           "on_the_go", "true_false"),
    ],
    "C++ lambdas and std::function": [
        _t("What's the danger in `[&]` (capture-by-reference) lambdas that outlive their scope?",
           "They hold references to locals; once the enclosing scope ends, those references "
           "dangle. Capturing by value `[=]` (or specific values) avoids it.",
           "Common with lambdas stored in callbacks/threads.",
           "on_the_go", "trap"),
        _t("Why can std::function be slower than a raw lambda passed as a template parameter?",
           "std::function type-erases the callable, often heap-allocating and preventing "
           "inlining (an indirect call). A lambda passed as a template type can be inlined.",
           "Relevant on hot paths; prefer templates/auto over std::function there.",
           "short_drill", ""),
    ],
    # ---------------- C++ Advanced ----------------
    "C++ undefined behaviour": [
        _t("Is signed integer overflow defined behaviour in C++?",
           "No - signed overflow is undefined behaviour (the compiler may assume it never "
           "happens). Unsigned overflow, by contrast, is defined (wraps modulo 2^n).",
           "A favourite gotcha; UB lets the optimiser do surprising things.",
           "on_the_go", "trap"),
        _t("Spot the UB:\n  int a[3];\n  int x = a[3];",
           "Reading a[3] is out-of-bounds (valid indices are 0..2) AND a is uninitialised - "
           "both undefined behaviour.",
           "Off-by-one + uninitialised read.",
           "on_the_go", "trap"),
        _t("True or false: dereferencing a pointer after `delete` is fine as long as you "
           "don't write through it.",
           "False. Any use of a pointer to freed memory (read or write) is undefined "
           "behaviour (use-after-free).",
           "Set to nullptr after delete, or use smart pointers.",
           "on_the_go", "true_false"),
    ],
    "C++ cache and memory layout": [
        _t("Why is iterating a std::vector usually much faster than a std::list of the same "
           "size, even when both are O(n)?",
           "vector is contiguous -> excellent spatial locality and cache-line use; list nodes "
           "are scattered -> frequent cache misses and pointer chasing.",
           "Constant factors from the cache dominate in practice.",
           "on_the_go", "concept"),
        _t("What is 'false sharing' and why does it hurt multithreaded performance?",
           "Two threads write different variables that happen to sit on the same cache line; "
           "the line ping-pongs between cores' caches, serialising them. Fix: pad/align so the "
           "variables live on separate cache lines.",
           "Classic low-latency concurrency pitfall.",
           "short_drill", ""),
    ],
    "C++ virtual dispatch cost": [
        _t("Why can a virtual call be costly on a hot path?",
           "It's an indirect call through the vtable: an extra memory load, a possible cache "
           "miss, and - crucially - the compiler usually can't inline it, blocking further "
           "optimisation.",
           "Templates/CRTP or final can help devirtualise.",
           "short_drill", ""),
        _t("True or false: marking a class or method `final` can let the compiler devirtualise "
           "calls.",
           "True. final tells the compiler no further override exists, so it may resolve the "
           "call statically and even inline it.",
           "Useful low-latency micro-optimisation.",
           "on_the_go", "true_false"),
    ],
    "C++ concurrency: races and memory order": [
        _t("Two threads write the same non-atomic int with no synchronisation. What is this?",
           "A data race - undefined behaviour in C++. Use std::atomic or a mutex.",
           "'It usually works' is not safe; it's UB.",
           "on_the_go", "trap"),
        _t("What does std::atomic give you that volatile does not?",
           "Atomicity of operations and a defined memory-ordering model across threads. "
           "volatile only prevents certain compiler optimisations - it is NOT a threading tool "
           "in C++.",
           "volatile != atomic is a common misconception.",
           "on_the_go", "misconception"),
    ],
    "C++ low-latency idioms": [
        _t("Name two ways to avoid heap allocation on a hot path.",
           "Reserve container capacity up front (vector::reserve); reuse buffers instead of "
           "reallocating; use stack/small-buffer or object pools; avoid std::string/std::function "
           "churn. (Any two.)",
           "Allocation = latency + jitter; the hot path should be allocation-free.",
           "short_drill", ""),
        _t("Why mark move constructors and swap `noexcept`?",
           "Containers like std::vector will only *move* (instead of copy) elements on reallocation "
           "if the move constructor is noexcept; otherwise they copy for the strong exception "
           "guarantee - a silent performance loss.",
           "noexcept moves are a real, measurable win.",
           "on_the_go", "trap"),
    ],
    # ---------------- Python Foundations ----------------
    "Python mutability and the data model": [
        _t("What does this print?\n  a = [1, 2, 3]\n  b = a\n  b.append(4)\n  print(a)",
           "[1, 2, 3, 4]. b and a are two names for the same list object; appending through "
           "one is visible through the other.",
           "Names bind to objects; assignment doesn't copy. Use a.copy() for a shallow copy.",
           "on_the_go", "trap"),
        _t("True or false: `a is b` and `a == b` mean the same thing.",
           "False. `==` compares value (equality); `is` compares identity (same object). Two "
           "equal lists are == but not is.",
           "Use `is` only for None/singletons.",
           "on_the_go", "true_false"),
    ],
    "Python default mutable arguments": [
        _t("What does this print on the SECOND call?\n  def f(x, acc=[]):\n      acc.append(x)\n"
           "      return acc\n  f(1); print(f(2))",
           "[1, 2]. The default list is created ONCE at function-definition time and reused, so "
           "it accumulates across calls. Fix: `def f(x, acc=None): acc = [] if acc is None else acc`.",
           "The single most common Python interview gotcha.",
           "on_the_go", "trap"),
    ],
    "Python comprehensions": [
        _t("What's the difference between `[x*x for x in r]` and `(x*x for x in r)`?",
           "The first builds a full list in memory; the second is a generator expression that "
           "yields lazily, using O(1) memory - good for large/streamed data.",
           "Brackets vs parentheses = eager vs lazy.",
           "on_the_go", "concept"),
    ],
    "Python context managers": [
        _t("Why is `with open(path) as f:` preferred over `f = open(path)`?",
           "The context manager guarantees f.close() runs on exit - even if an exception is "
           "raised - via __enter__/__exit__. The bare open leaks the file handle on error.",
           "Resource safety on the exception path is the point.",
           "on_the_go", "concept"),
        _t("How do you write a context manager without a class?",
           "Use contextlib.contextmanager on a generator: code before `yield` is __enter__, code "
           "after (ideally in a finally) is __exit__.",
           "Refresher worth knowing cold for interviews.",
           "short_drill", ""),
    ],
    "Python decorators": [
        _t("What does a decorator `@d` on `def f(): ...` actually do?",
           "It rebinds f to d(f): the function object is passed to d and replaced by whatever d "
           "returns (usually a wrapper).",
           "Decorators are just `f = d(f)`.",
           "on_the_go", "concept"),
        _t("Why use functools.wraps inside a decorator's wrapper?",
           "It copies the wrapped function's metadata (__name__, __doc__, signature) onto the "
           "wrapper, so introspection/debugging still shows the original function.",
           "Without it, every decorated function looks like 'wrapper'.",
           "on_the_go", "trap"),
    ],
    "Python typing and annotations": [
        _t("True or false: Python enforces type hints at runtime.",
           "False. Annotations are not enforced by the interpreter; they're for tools (mypy, "
           "IDEs) and documentation. You can pass a str where an int is hinted and it runs.",
           "Static checking is opt-in via a checker.",
           "on_the_go", "misconception"),
        _t("What does Optional[int] mean?",
           "int or None - i.e. Union[int, None]. It does NOT mean 'the argument is optional'.",
           "Common confusion between Optional-as-type and default-as-optional.",
           "on_the_go", "trap"),
    ],
    # ---------------- Python Advanced ----------------
    "Python generators and lazy evaluation": [
        _t("What does calling a function with `yield` in it return?",
           "A generator object (an iterator). No body code runs until you iterate it (next()); "
           "it then runs up to each yield, pausing and resuming with its state preserved.",
           "Calling it does nothing until iterated - a frequent surprise.",
           "on_the_go", "concept"),
        _t("Why might `sum(x*x for x in range(10**8))` be preferable to building a list first?",
           "The generator computes one value at a time -> O(1) extra memory, whereas the list "
           "would allocate ~10^8 ints at once and likely blow memory.",
           "Lazy evaluation for large/streamed data.",
           "short_drill", ""),
    ],
    "Python the GIL: threads vs processes": [
        _t("You have a CPU-bound numeric loop in pure Python. Will threads make it faster?",
           "No. The GIL lets only one thread execute Python bytecode at a time, so CPU-bound "
           "pure-Python work doesn't parallelise across threads. Use multiprocessing (or "
           "native/numpy code that releases the GIL).",
           "The #1 Python concurrency interview question.",
           "on_the_go", "trap"),
        _t("When ARE threads useful in CPython despite the GIL?",
           "For I/O-bound work (network, disk): a thread releases the GIL while waiting on I/O, "
           "so others run. Also when calling C extensions that release the GIL.",
           "Threads for I/O, processes for CPU.",
           "on_the_go", "concept"),
    ],
    "Python numpy vectorization": [
        _t("Why is `a * b` on two numpy arrays far faster than a Python for-loop doing the same?",
           "The vectorised op runs in compiled C over contiguous typed memory (no per-element "
           "Python object/bytecode overhead) and can use SIMD; the loop pays interpreter cost "
           "per element.",
           "Vectorise; avoid Python-level loops over arrays.",
           "on_the_go", "concept"),
        _t("True or false: a numpy array of dtype int64 uses about the same memory per element "
           "as a Python list of ints.",
           "False. numpy stores raw 8-byte ints contiguously; a Python list stores pointers to "
           "boxed int objects (~28+ bytes each plus the pointer) - far more memory.",
           "Typed contiguous storage is a core numpy win.",
           "on_the_go", "true_false"),
    ],
    "Python pandas idioms": [
        _t("Why avoid `df.apply(..., axis=1)` / `iterrows()` for a row-wise numeric computation?",
           "They loop in Python (slow, boxing each row). Prefer vectorised column operations "
           "(e.g. df['a'] + df['b']) or numpy, which run in C over the whole column.",
           "apply/iterrows are the pandas performance traps.",
           "on_the_go", "trap"),
    ],
    "Python views vs copies": [
        _t("Does basic numpy slicing like `a[2:5]` return a copy or a view?",
           "A view - it shares memory with the original, so writing to the slice changes the "
           "original. Fancy indexing (a[[2,4]]) and boolean masks return copies.",
           "Slicing = view; fancy/boolean = copy. Source of subtle bugs.",
           "on_the_go", "trap"),
    ],
    "Python performance and profiling": [
        _t("What's the time complexity of checking `x in s` for a set vs a list of n items?",
           "Set: O(1) average (hash lookup). List: O(n) (linear scan). For membership tests, "
           "use a set.",
           "Swapping list->set for membership is a classic easy win.",
           "on_the_go", "mcq"),
        _t("Your function is slow - what's the first step before optimising?",
           "Measure: profile it (cProfile / timeit) to find the actual hotspot, rather than "
           "guessing. Optimise the part that dominates.",
           "Measure, don't guess.",
           "short_drill", ""),
    ],
    # ---------------- Probability ----------------
    "Counting and combinatorics": [
        _t("How many distinct arrangements of the letters in 'LEVEL'?",
           "30 = 5! / (2!·2!) (L and E each repeat twice).",
           "Divide by factorials of repeats. 120 forgets the repeats.",
           "short_drill", ""),
        _t("From 10 people, how many committees of 3 (order irrelevant)?",
           "C(10,3) = 120.",
           "Combination, not permutation (which would be 720).",
           "on_the_go", "mcq"),
    ],
    "Conditional probability and Bayes": [
        _t("Disease prevalence 1%; test 99% sensitive, 95% specific. P(disease | positive)? "
           "(nearest %)",
           "~17%. (0.99·0.01)/(0.99·0.01 + 0.05·0.99) = 0.0099/0.0594 ≈ 0.167.",
           "Base-rate fallacy: a 99% answer ignores the 1% prevalence.",
           "problem", ""),
        _t("True or false: P(A|B) = P(B|A) in general.",
           "False - that's the base-rate / prosecutor's fallacy. They're related by Bayes but "
           "not equal unless P(A)=P(B).",
           "Confusing the two conditionals is the classic error.",
           "on_the_go", "true_false"),
    ],
    "Expectation and linearity": [
        _t("Expected number of heads in 10 fair coin flips?",
           "5, by linearity of expectation: 10 × 0.5.",
           "Linearity needs no independence.",
           "on_the_go", "mcq"),
        _t("Expected value of one roll of a fair six-sided die?",
           "3.5 = (1+2+3+4+5+6)/6.",
           "Mean of a discrete uniform.",
           "on_the_go", "mcq"),
    ],
    "Common distributions": [
        _t("X ~ Binomial(n=5, p=0.5). P(X = 2)?",
           "0.3125 = C(5,2)·0.5^5 = 10/32.",
           "Accept fraction or decimal.",
           "short_drill", ""),
        _t("Expected number of fair-coin flips to get the first head?",
           "2 = 1/p for Geometric(p=0.5).",
           "Geometric expectation 1/p.",
           "on_the_go", "mcq"),
    ],
    # ---------------- Brain teasers ----------------
    "Expected-value games": [
        _t("You roll a fair die and are paid its value in dollars. Fair price to play once?",
           "$3.50 - the expected payout.",
           "Fair price = expected value.",
           "on_the_go", "mcq"),
        _t("A fair coin: you win $1 per head and stop at the first tail. Expected winnings?",
           "$1. Number of heads before the first tail is Geometric: expected heads = (1-p)/p "
           "with p=0.5 -> 1, each worth $1.",
           "Optional-stopping flavour; expected heads before first tail = 1.",
           "problem", ""),
    ],
    "Estimation (Fermi)": [
        _t("Roughly how many times does a person's heart beat in a lifetime? Give the method.",
           "~2-3 billion. ~70 bpm × 60 × 24 × 365 ≈ 3.7×10^7/yr × ~70-80 yrs ≈ 2.5-3×10^9.",
           "Reward a sensible decomposition and order of magnitude, not the exact figure.",
           "short_drill", ""),
    ],
    "Logic puzzles": [
        _t("Two ropes each burn in exactly 60 min but unevenly. Measure 45 minutes.",
           "Light rope A at both ends and rope B at one end. A burns out in 30 min; at that "
           "moment light B's other end - its remaining 30 min of rope now burns in 15. "
           "Total 45.",
           "Burning both ends halves the time; classic.",
           "problem", ""),
    ],
    # ---------------- Finance ----------------
    "Time value of money": [
        _t("Present value of $100 in one year at a 5% annual rate?",
           "≈ $95.24 = 100 / 1.05.",
           "PV = FV/(1+r).",
           "on_the_go", "mcq"),
        _t("True or false: a higher discount rate makes a future cash flow worth more today.",
           "False - a higher rate discounts harder, so PV is LOWER.",
           "Rate up -> PV down.",
           "on_the_go", "true_false"),
    ],
    "Option payoffs": [
        _t("Payoff at expiry of a long call with strike K when the stock is S?",
           "max(S - K, 0). You exercise only if S > K.",
           "Buyer's payoff is non-negative (premium aside).",
           "on_the_go", "concept"),
        _t("True or false: the most a buyer of a call option can lose is unlimited.",
           "False. A call buyer's loss is capped at the premium paid. Unlimited loss is the "
           "SELLER of a naked call.",
           "Long option = limited loss; short option = large/unlimited risk.",
           "on_the_go", "trap"),
    ],
    "No-arbitrage intuition": [
        _t("In one sentence, what does 'no-arbitrage' mean?",
           "There's no way to make a riskless profit with zero net investment; identical "
           "payoffs must have identical prices (law of one price).",
           "Replication + law of one price.",
           "short_drill", ""),
    ],
    "What the Greeks mean": [
        _t("What does an option's delta measure?",
           "The sensitivity of the option price to a small move in the underlying: dPrice/dS "
           "(≈ how many shares the option behaves like). ~0.5 for an at-the-money call.",
           "Delta = first derivative w.r.t. spot.",
           "on_the_go", "concept"),
        _t("True or false: theta is usually positive for a long option.",
           "False. Theta (time decay) is typically negative for a long option - it loses value "
           "as expiry approaches, all else equal.",
           "Long options bleed theta.",
           "on_the_go", "true_false"),
    ],
}
