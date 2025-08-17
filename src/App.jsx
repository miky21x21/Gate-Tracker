import React, { useEffect, useMemo, useState } from "react";

/*
  GATE DA Study Tracker - Version 2
  Features:
  - 150-day spiral schedule (5 learning days + 2 review days weekly)
  - Dynamic schedule generator (mixes topics each week for spaced repetition)
  - Syllabus tab (full GATE DA syllabus items) with progress tracking
  - Dark mode toggle (saved to localStorage)
  - Daily rotating self-mastery quote
  - Export/Import JSON & local save
  - "Today" quick-jump
*/

const STORAGE_KEY = "gate-da-tracker-v2";
const THEME_KEY = "gate-da-theme";

// --- Syllabus (atomic items taken from user's syllabus text) ---
const SYLLABUS_ITEMS = [
  // Probability & Statistics
  "Counting: permutations & combinations",
  "Probability axioms & sample space",
  "Events: independent & mutually exclusive",
  "Marginal, conditional & joint probability",
  "Bayes Theorem",
  "Conditional expectation & variance",
  "Mean, median, mode & standard deviation",
  "Correlation & covariance",
  "Random variables (concept)",
  "Discrete RVs & PMF",
  "Uniform (discrete) & Bernoulli",
  "Binomial distribution",
  "Poisson distribution",
  "Continuous RVs: PDF & CDF",
  "Uniform (continuous), Exponential",
  "Normal & standard normal",
  "t-distribution, chi-squared distributions",
  "Conditional PDF",
  "Central Limit Theorem",
  "Confidence intervals",
  "z-test, t-test, chi-squared test",

  // Linear Algebra
  "Vector space & subspaces",
  "Linear dependence & independence",
  "Matrices: basics & properties",
  "Projection matrix",
  "Orthogonal matrix",
  "Idempotent & partition matrices",
  "Quadratic forms",
  "Systems of linear equations & Gaussian elimination",
  "Eigenvalues & eigenvectors",
  "Determinant, rank & nullity",
  "Projections & LU decomposition",
  "Singular value decomposition (SVD)",

  // Calculus & Optimization
  "Functions of single variable: limit/continuity/differentiability",
  "Taylor series",
  "Maxima & minima",
  "Single-variable optimization (incl. Lagrange - light)",

  // Programming, DS & Algorithms
  "Programming in Python: syntax & basics",
  "Stacks & queues",
  "Linked lists",
  "Trees (binary trees intro)",
  "Hash tables",
  "Linear & binary search",
  "Basic sorting: selection, bubble, insertion",
  "Divide & conquer: mergesort, quicksort",
  "Introduction to graph theory",
  "Graph algorithms: traversals (BFS/DFS)",
  "Shortest path algorithms",

  // DBMS & Warehousing
  "ER-model & relational model",
  "Relational algebra & tuple calculus",
  "SQL: SELECT, WHERE, JOINs",
  "Integrity constraints & normal forms",
  "File organization & indexing",
  "Data types, normalization, discretization, sampling",
  "Compression & data transformation",
  "Data warehouse modelling: schemas & hierarchies",

  // Machine Learning - Supervised
  "Regression: simple & multiple",
  "Ridge regression",
  "Logistic regression",
  "k-NN",
  "Naive Bayes",
  "Linear Discriminant Analysis (LDA)",
  "Support Vector Machine (SVM)",
  "Decision Trees",
  "Bias-Variance tradeoff",
  "Cross-validation: LOO & k-folds",
  "Multi-layer Perceptron (MLP) / Feed-forward NN",

  // Machine Learning - Unsupervised
  "Clustering: k-means / k-medoids",
  "Hierarchical clustering (top-down, bottom-up)",
  "Dimensionality reduction: PCA",

  // AI
  "Search: uninformed methods",
  "Search: informed methods (heuristics, A*)",
  "Adversarial search (minimax, alpha-beta)",
  "Propositional & predicate logic (intro)",
  "Reasoning under uncertainty: conditional independence",
  "Exact inference: variable elimination",
  "Approximate inference: sampling methods",
];

// --- Free resource map (study + practice) ---
const RESOURCES = {
  ka: "https://www.khanacademy.org/",
  mitprob:
    "https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/",
  threeb:
    "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr",
  mitla: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
  cs50p: "https://cs50.harvard.edu/python/2022/",
  sqlbolt: "https://sqlbolt.com/",
  visu: "https://visualgo.net/en",
  gateoverflow: "https://gateoverflow.in/tags",
  kaggle: "https://www.kaggle.com/learn",
  sklearn: "https://scikit-learn.org/stable/",
  googleml: "https://developers.google.com/machine-learning/crash-course",
  mitai: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/",
  aima: "https://aima.cs.berkeley.edu/",
};

function pickResource(key) {
  return RESOURCES[key] || RESOURCES.ka;
}

const QUOTES = [
  "Small daily improvements lead to stunning results.",
  "Discipline equals freedom. — Jocko Willink",
  "We are what we repeatedly do. Excellence, then, is a habit. — Aristotle",
  "Fall in love with the process, and the results will come.",
  "Action is the foundational key to all success. — Picasso",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Do something today that your future self will thank you for.",
  "Progress, not perfection.",
  "Consistency compounds. Keep showing up.",
  "Hard work beats talent when talent doesn't work hard.",
  "He who conquers others is strong; he who conquers himself is mighty. - Lao Tzu",
  "The happiness of your life depends upon the quality of your thoughts. - Marcus Aurelius",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
  "It is not what happens to you, but how you react to it that matters. - Epictetus",
  "The only true wisdom is in knowing you know nothing. - Socrates",
  "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven. - John Milton",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "The journey of a thousand miles begins with a single step. - Lao Tzu",
  "You have power over your mind - not outside events. Realize this, and you will find strength. - Marcus Aurelius",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Do not pray for an easy life, pray for the strength to endure a difficult one. - Bruce Lee",
  "The man who moves a mountain begins by carrying away small stones. - Confucius",
  "Our greatest glory is not in never falling, but in rising every time we fall. - Confucius",
  "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
  "What you do speaks so loudly that I cannot hear what you say. - Ralph Waldo Emerson",
  "The greatest mistake you can make in life is to be continually fearing you will make one. - Elbert Hubbard",
  "The only way to make sense out of change is to plunge into it, move with it, and join the dance. - Alan Watts",
  "To live a good life: We have the potential for it. If we can learn to be indifferent to what makes no difference. - Marcus Aurelius",
  "All of humanitys problems stem from mans inability to sit quietly in a room alone. - Blaise Pascal",
  "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. - Ralph Waldo Emerson",
  "The only person who is educated is the one who has learned how to learn and change. - Carl Rogers",
  "The two most important days in your life are the day you are born and the day you find out why. - Mark Twain",
  "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment. - Marcus Aurelius",
  "We cant be afraid of change. You may feel very secure in the pond that you are in, but if you never venture out of it, you will never know that there is such a thing as an ocean, a sea. - C. JoyBell C.",
  "Do not wait for leaders; do it alone, person to person. - Mother Teresa",
  "The man who has confidence in himself gains the confidence of others. - Hasidic Proverb",
  "In the midst of winter, I found there was, within me, an invincible summer. - Albert Camus",
  "The first step toward change is awareness. The second step is acceptance. - Nathaniel Branden",
  "There is only one corner of the universe you can be certain of improving, and that's your own self. - Aldous Huxley",
  "The only constant in life is change. - Heraclitus",
  "Every man is the architect of his own fortune. - Sallust",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
  "The highest activity a human being can attain is learning for understanding, because to understand is to be free. - Baruch Spinoza",
  "It is better to be a human being dissatisfied than a pig satisfied; better to be Socrates dissatisfied than a fool satisfied. - John Stuart Mill",
  "The greatest mistake you can make in life is to be continually fearing you will make one. - Elbert Hubbard",
  "You will never be happy if you continue to search for what happiness consists of. You will never live if you are looking for the meaning of life. - Albert Camus",
  "Every person is a new door to a different world. - A.J. Darkholme",
  "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking. - Albert Einstein",
  "To accept a limitation is to deny one's potential for self-overcoming. To be human is to be in a constant state of becoming. - Jean-Paul Sartre",
  "The greatest good is to be found in the service of others. - Albert Schweitzer",
  "He who controls others may be powerful, but he who has mastered himself is mightier still. - Lao Tzu",
  "The path to your own self is the true journey. - Rumi",
  "Self-worth comes from one thing: thinking that you are worthy. - Wayne Dyer",
  "The secret of change is to focus all of your energy, not on fighting the old, but on building the new. - Socrates",
  "We are what we pretend to be, so we must be careful about what we pretend to be. - Kurt Vonnegut",
  "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
  "Happiness is not a station you arrive at, but a manner of traveling. - Margaret Lee Runbeck",
  "The art of being happy lies in the power of extracting happiness from common things. - Henry Ward Beecher",
  "To live a good life: We have the potential for it. If we can learn to be indifferent to what makes no difference. - Marcus Aurelius",
  "The purpose of our lives is to be happy. - Dalai Lama",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
  "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
  "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
  "He who has a 'why' to live for can bear almost any 'how'. - Friedrich Nietzsche",
  "The greatest good is to be found in the service of others. - Albert Schweitzer",
  "It is not the man who has too little, but the man who craves more, that is poor. - Seneca",
  "A ship is safe in harbor, but that's not what ships are for. - William G. T. Shedd",
  "What is necessary to change a person is to change his awareness of himself. - Abraham Maslow",
  "The unexamined life is not worth living. - Socrates",
  "Know thyself. - Inscription at the Temple of Apollo at Delphi",
  "Man is a creature who can get used to anything. - Fyodor Dostoevsky",
  "He who conquers others is strong; he who conquers himself is mighty. - Lao Tzu",
  "The happiness of your life depends upon the quality of your thoughts. - Marcus Aurelius",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
  "It is not what happens to you, but how you react to it that matters. - Epictetus",
  "The only true wisdom is in knowing you know nothing. - Socrates",
  "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven. - John Milton",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "The journey of a thousand miles begins with a single step. - Lao Tzu",
  "You have power over your mind - not outside events. Realize this, and you will find strength. - Marcus Aurelius",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Do not pray for an easy life, pray for the strength to endure a difficult one. - Bruce Lee",
  "The man who moves a mountain begins by carrying away small stones. - Confucius",
  "Our greatest glory is not in never falling, but in rising every time we fall. - Confucius",
  "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
  "What you do speaks so loudly that I cannot hear what you say. - Ralph Waldo Emerson",
  "The greatest mistake you can make in life is to be continually fearing you will make one. - Elbert Hubbard",
  "The only way to make sense out of change is to plunge into it, move with it, and join the dance. - Alan Watts",
];

// --- Topic pools (arrays of micro-topics mapped to syllabus items) ---
const TOPIC_POOLS = {
  prob: [
    "Counting: permutations & combinations",
    "Probability axioms & sample space",
    "Events: independent & mutually exclusive",
    "Marginal, conditional & joint probability",
    "Bayes Theorem",
    "Conditional expectation & variance",
    "Mean, median, mode & std dev",
    "Correlation & covariance",
    "Random variables intro",
    "Discrete RVs & PMF",
  ],
  dist: [
    "Uniform (discrete) & Bernoulli",
    "Binomial distribution",
    "Poisson distribution",
    "Continuous RVs: PDF & CDF",
    "Uniform (continuous), Exponential",
    "Normal & standard normal",
    "t-distribution & chi-sq",
  ],
  stats_infer: [
    "Conditional PDF",
    "Central Limit Theorem",
    "Confidence intervals",
    "z-test & t-test",
    "Chi-squared test",
  ],
  la: [
    "Vector space & subspaces",
    "Linear dependence & independence",
    "Matrices: basics & properties",
    "Projection & orthogonal matrices",
    "Idempotent & partition matrices",
    "Quadratic forms",
    "Systems of linear equations & Gaussian elimination",
    "Determinant, rank & nullity",
    "Eigenvalues & eigenvectors",
    "LU decomposition",
    "Singular Value Decomposition (SVD)",
  ],
  calculus: [
    "Limits & continuity",
    "Differentiability",
    "Taylor series",
    "Maxima & minima",
    "Single-variable optimization",
  ],
  prog: [
    "Python basics: syntax & data types",
    "Loops & functions",
    "OOP intro (Python)",
    "Lists, tuples, dicts in Python",
    "File I/O & scripting",
  ],
  ds: [
    "Stacks & queues (implementation)",
    "Linked lists (single/double)",
    "Trees: binary tree intro",
    "Hash table concepts & collisions",
    "Advanced DS: heaps (light)",
  ],
  algo: [
    "Linear & binary search",
    "Selection, bubble, insertion sort",
    "Merge sort & Quick sort",
    "Divide & conquer patterns",
    "Complexity: Big-O basics",
  ],
  graphs: [
    "Introduction to graph theory & representation",
    "BFS traversal",
    "DFS traversal",
    "Shortest path: Dijkstra intro",
    "MST intro (Kruskal/Prim)",
  ],
  db: [
    "ER-model & relational model intro",
    "Relational algebra basics",
    "SQL: SELECT, WHERE, JOINs",
    "Integrity constraints & Normal forms",
    "Indexing & file organization",
    "Data transformation: normalization, discretization",
  ],
  ml_sup: [
    "Simple linear regression",
    "Multiple linear regression",
    "Ridge regression (regularization)",
    "Logistic regression",
    "k-NN classifier",
    "Naive Bayes classifier",
    "LDA overview",
    "Decision trees",
    "SVM basics",
    "Bias-variance tradeoff",
    "Cross-validation: k-fold & LOO",
    "MLP / Feed-forward neural networks",
  ],
  ml_unsup: [
    "k-means clustering",
    "k-medoids overview",
    "Hierarchical clustering: single/multiple linkage",
    "Dimensionality reduction: PCA",
  ],
  ai: [
    "Uninformed search algorithms",
    "Informed search & heuristics (A*)",
    "Adversarial search: minimax & alpha-beta",
    "Propositional logic basics",
    "Predicate logic intro",
    "Conditional independence representation",
    "Exact inference: variable elimination",
    "Approximate inference: sampling",
  ],
};

const POOL_KEYS = [
  "prob",
  "la",
  "prog",
  "ds",
  "algo",
  "db",
  "ml_sup",
  "ml_unsup",
  "ai",
  "dist",
  "stats_infer",
  "graphs",
  "calculus",
];

function generateSchedule(days = 150, startDate = null) {
  const pointers = {};
  Object.keys(TOPIC_POOLS).forEach((k) => (pointers[k] = 0));

  const schedule = [];
  for (let i = 0; i < days; i++) {
    const dayOfWeek = i % 7;
    const week = Math.floor(i / 7);
    const isLearning = dayOfWeek < 5;

    if (isLearning) {
      const baseIndex = (week + dayOfWeek) % POOL_KEYS.length;
      const pickIndex = (baseIndex + dayOfWeek) % POOL_KEYS.length;
      const poolKey = POOL_KEYS[pickIndex];
      const pool = TOPIC_POOLS[poolKey];
      const p = pointers[poolKey] % pool.length;
      pointers[poolKey] = pointers[poolKey] + 1;
      const topic = pool[p];
      const resource = chooseResourceForPool(poolKey);

      schedule.push({
        day: i + 1,
        type: "learning",
        title: topic,
        study: resource.study,
        studyLink: resource.studyLink,
        practice: resource.practice,
        practiceLink: resource.practiceLink,
        difficulty: estimateDifficulty(poolKey, p, week),
      });
    } else {
      const lastFive = schedule
        .slice(Math.max(0, schedule.length - 5))
        .map((t) => t.title);
      schedule.push({
        day: i + 1,
        type: "review",
        title: `Review: ${
          lastFive.length ? lastFive.join(" • ") : "Catch-up & PYQs"
        }`,
        study: "Revise notes, re-solve PYQs from GATEOverflow",
        studyLink: pickResource("gateoverflow"),
        practice: "Timed practice / mini-project / Kaggle micro-task",
        practiceLink: pickResource("kaggle"),
        difficulty: "easy",
      });
    }
  }

  return schedule;
}

function chooseResourceForPool(poolKey) {
  switch (poolKey) {
    case "prob":
    case "dist":
    case "stats_infer":
      return {
        study: "MIT OCW / Khan Academy probability & stats lectures",
        studyLink: pickResource("mitprob"),
        practice: "Khan Academy practice + GATEOverflow PYQs",
        practiceLink: pickResource("gateoverflow"),
      };
    case "la":
    case "calculus":
      return {
        study: "3Blue1Brown + MIT OCW Linear Algebra / Calculus lectures",
        studyLink: pickResource("threeb"),
        practice: "MIT OCW problem sets + GATEOverflow",
        practiceLink: pickResource("gateoverflow"),
      };
    case "prog":
    case "ds":
      return {
        study: "CS50P, NumPy/Pandas docs",
        studyLink: pickResource("cs50p"),
        practice: "HackerRank / LeetCode (easy)",
        practiceLink: pickResource("gateoverflow"),
      };
    case "algo":
    case "graphs":
      return {
        study: "VisuAlgo + Khan Academy algorithms",
        studyLink: pickResource("visu"),
        practice: "HackerRank Graphs / GFG",
        practiceLink: pickResource("gateoverflow"),
      };
    case "db":
      return {
        study: "SQLBolt / SQLZoo / NPTEL DBMS lectures",
        studyLink: pickResource("sqlbolt"),
        practice: "SQLZoo interactive exercises",
        practiceLink: pickResource("sqlbolt"),
      };
    case "ml_sup":
    case "ml_unsup":
      return {
        study: "Kaggle Learn + scikit-learn tutorials",
        studyLink: pickResource("kaggle"),
        practice: "Kaggle micro-courses & exercises",
        practiceLink: pickResource("kaggle"),
      };
    case "ai":
      return {
        study: "MIT 6.034 + AIMA readings",
        studyLink: pickResource("mitai"),
        practice: "AIMA exercises + CS188 projects",
        practiceLink: pickResource("aima"),
      };
    default:
      return {
        study: "Khan Academy / MIT OCW",
        studyLink: pickResource("ka"),
        practice: "GATEOverflow",
        practiceLink: pickResource("gateoverflow"),
      };
  }
}

function estimateDifficulty(poolKey, poolIndex, week) {
  const base = ["prob", "dist", "la", "calculus", "prog"].includes(poolKey)
    ? 1
    : 2;
  const diff = Math.min(
    5,
    base + Math.floor(week / 6) + Math.floor(poolIndex / 4)
  );
  if (diff <= 2) return "Beginner";
  if (diff <= 3) return "Intermediate";
  return "Advanced";
}

// --- UI Components ---
function ProgressBar({ value }) {
  return (
    <div className="w-full h-3 bg-gray-200 rounded-2xl overflow-hidden">
      <div
        className="h-full bg-indigo-500 dark:bg-indigo-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TaskRow({ task, checked, onToggle }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-gray-300"
        checked={checked}
        onChange={() => onToggle(task.day)}
      />
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">{`Day ${task.day}: ${task.title}`}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          <div>
            Study:{" "}
            <a
              className="underline"
              href={task.studyLink}
              target="_blank"
              rel="noreferrer"
            >
              {task.study}
            </a>
          </div>
          <div>
            Practice:{" "}
            <a
              className="underline"
              href={task.practiceLink}
              target="_blank"
              rel="noreferrer"
            >
              {task.practice}
            </a>
          </div>
          <div className="mt-1 text-xs">Difficulty: {task.difficulty}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "light"
  );
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // initial generation
    const sched = generateSchedule(150);
    // group by month (approx 30 days each)
    const months = {};
    for (let i = 0; i < 5; i++) {
      months[i + 1] = sched.slice(i * 30, (i + 1) * 30);
    }
    return {
      months,
      checked: {},
      syllabusChecked: {},
      generatedAt: Date.now(),
    };
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const [activeTab, setActiveTab] = useState("plan");
  const [activeMonth, setActiveMonth] = useState(1);

  // derived stats
  const monthStats = useMemo(() => {
    const m = data.months[activeMonth] || [];
    const total = m.length;
    const done = m.filter((t) => data.checked[t.day]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [data, activeMonth]);

  function toggleTask(day) {
    setData((prev) => ({
      ...prev,
      checked: { ...prev.checked, [day]: !prev.checked[day] },
    }));
  }

  function toggleSyllabus(idx) {
    setData((prev) => ({
      ...prev,
      syllabusChecked: {
        ...prev.syllabusChecked,
        [idx]: !prev.syllabusChecked[idx],
      },
    }));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gate-da-tracker-v2.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((txt) => {
      try {
        const obj = JSON.parse(txt);
        if (!obj.months) throw new Error("Invalid file");
        setData(obj);
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    });
  }

  function resetProgress() {
    if (!confirm("Reset all progress?")) return;
    setData((prev) => ({ ...prev, checked: {}, syllabusChecked: {} }));
  }

  const todayIndex = (() => {
    // simple mapping: day 1 = start of plan when generatedAt
    const start = data.generatedAt || Date.now();
    const daysPassed = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    return Math.min(149, Math.max(0, daysPassed));
  })();

  const quoteOfDay = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  function jumpToToday() {
    const day = todayIndex + 1;
    const m = Math.ceil(day / 30);
    setActiveMonth(m);
    const el = document.getElementById("day-" + day);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const syllabusTotal = SYLLABUS_ITEMS.length;
  const syllabusDone = Object.values(data.syllabusChecked || {}).filter(
    Boolean
  ).length;
  const syllabusPct = Math.round((syllabusDone / syllabusTotal) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              GATE DA Study Tracker — Spiral 150-day Plan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Mix-based spiral learning • 5 learning days + 2 review days each
              week • Progress saved locally
            </p>
            <div className="mt-2 text-xs italic text-indigo-700 dark:text-indigo-300">
              {quoteOfDay}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border shadow-sm"
            >
              {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
            <button
              onClick={jumpToToday}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border shadow-sm"
            >
              Jump to Today
            </button>
            <button
              onClick={resetProgress}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border shadow-sm"
            >
              Reset
            </button>
            <button
              onClick={exportJSON}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border shadow-sm"
            >
              Export
            </button>
            <label className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border shadow-sm cursor-pointer">
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importJSON}
              />
            </label>
          </div>
        </header>

        <nav className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-3 py-2 rounded-2xl ${
              activeTab === "plan"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            Plan
          </button>
          <button
            onClick={() => setActiveTab("syllabus")}
            className={`px-3 py-2 rounded-2xl ${
              activeTab === "syllabus"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            Syllabus
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2 rounded-2xl ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            Overview
          </button>
        </nav>

        {activeTab === "plan" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold">
                  Month {activeMonth} • Day-by-day
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {monthStats.done}/{monthStats.total} done • {monthStats.pct}%
                </div>
              </div>
              <div style={{ width: 240 }}>
                <ProgressBar value={monthStats.pct} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                {data.months[activeMonth].map((task) => (
                  <div id={`day-${task.day}`} key={task.day}>
                    <TaskRow
                      task={task}
                      checked={!!data.checked[task.day]}
                      onToggle={toggleTask}
                    />
                  </div>
                ))}
              </div>

              <aside className="bg-white dark:bg-gray-800 p-4 rounded-2xl border">
                <h3 className="font-semibold mb-2">Month Navigation</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() => setActiveMonth(m)}
                      className={`px-2 py-1 rounded ${
                        activeMonth === m
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      Month {m}
                    </button>
                  ))}
                </div>
                <h4 className="text-sm font-medium mt-2">Quick Links</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>
                    Study resources are canonical: MIT OCW, Khan Academy,
                    Kaggle, scikit-learn.
                  </li>
                  <li>
                    Practice links point to GATEOverflow / Kaggle / SQLBolt
                    where applicable.
                  </li>
                </ul>
              </aside>
            </div>
          </section>
        )}

        {activeTab === "syllabus" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">GATE DA Syllabus</h2>
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              Tick off items as you master them. This tracks the big-picture
              progress.
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {SYLLABUS_ITEMS.map((s, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-gray-800 border"
                >
                  <input
                    type="checkbox"
                    checked={!!data.syllabusChecked[idx]}
                    onChange={() => toggleSyllabus(idx)}
                  />
                  <div className="text-sm">{s}</div>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Syllabus Progress</h4>
              <div className="mt-2" style={{ width: 320 }}>
                <ProgressBar value={syllabusPct} />
              </div>
              <div className="text-sm mt-2">
                {syllabusDone}/{syllabusTotal} items done
              </div>
            </div>
          </section>
        )}

        {activeTab === "overview" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Overview & Tools</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              This view helps you export/import your plan, reset progress, or
              jump to today.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
                <h4 className="font-medium">Plan Stats</h4>
                <div className="mt-2 text-sm">
                  Generated on: {new Date(data.generatedAt).toDateString()}
                </div>
                <div className="mt-2 text-sm">
                  Total days: 150 • Months: 5 • Week pattern: 5 learning + 2
                  review
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
                <h4 className="font-medium">Daily Quote</h4>
                <div className="mt-2 text-sm italic">{quoteOfDay}</div>
              </div>
            </div>
          </section>
        )}

        <footer className="text-xs text-gray-500 mt-6">
          Tip: Use Export/Import JSON to sync between devices. For cloud sync, I
          can add Firebase later (free tier).
        </footer>
      </div>
    </div>
  );
}
