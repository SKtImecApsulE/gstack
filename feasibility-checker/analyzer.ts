// Heuristic feasibility analyzer — the zero-dependency fallback used when
// no ANTHROPIC_API_KEY is available. Pattern-scores the request against
// known impossibility classes and returns a structured verdict.

export interface Verdict {
  verdict: 'POSSIBLE' | 'NOT_POSSIBLE' | 'UNCERTAIN';
  confidence: number; // 0-100
  reasoning: string;
  engine: 'heuristic' | 'claude';
}

interface Rule {
  pattern: RegExp;
  verdict: Verdict['verdict'];
  confidence: number;
  reasoning: string;
}

const RULES: Rule[] = [
  // Physically impossible
  {
    pattern: /perpetual\s+motion|infinite\s+energy|free\s+energy\s+machine|over.?unity/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 98,
    reasoning:
      'This violates the laws of thermodynamics. No machine can output more energy than it consumes, so perpetual motion and free-energy devices are physically impossible.',
  },
  {
    pattern: /faster\s+than\s+(the\s+speed\s+of\s+)?light|ftl\s+(travel|drive|communication)/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 97,
    reasoning:
      'Faster-than-light travel or communication violates special relativity as we currently understand it. No known physics permits it.',
  },
  {
    pattern: /time\s+travel|travel\s+(back|backwards?)\s+in\s+time|go\s+back\s+to\s+the\s+past/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 95,
    reasoning:
      'Backwards time travel has no known physical mechanism and creates causality paradoxes. Under current physics this is not possible.',
  },
  {
    pattern: /teleport|teleportation/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 90,
    reasoning:
      'Teleportation of macroscopic objects or people is far beyond any known or foreseeable technology. Quantum teleportation transfers state, not matter.',
  },
  {
    pattern: /bring\s+(back\s+)?(the\s+)?dead|resurrect|immortal(ity)?|live\s+forever|never\s+die/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 92,
    reasoning:
      'Reversing death or achieving true immortality is not possible with any current or foreseeable medical technology.',
  },
  // Logically impossible
  {
    pattern: /square\s+circle|married\s+bachelor|largest\s+(prime|number)\b|divide\s+by\s+zero/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 99,
    reasoning:
      'This is logically or mathematically impossible: the request contradicts its own definitions.',
  },
  // Clearly feasible software/everyday tasks
  {
    pattern: /\b(build|create|make|develop|design)\b.*\b(website|web\s*site|web\s*app|app|application|landing\s+page|api|bot|script|dashboard|game|blog|portfolio|store|extension)\b/i,
    verdict: 'POSSIBLE',
    confidence: 95,
    reasoning:
      'This is a standard software project. With modern tools and frameworks it is very achievable; scope and timeline are the only real variables.',
  },
  {
    pattern: /\b(learn|study)\b.*\b(language|coding|programming|python|javascript|guitar|piano|skill)\b/i,
    verdict: 'POSSIBLE',
    confidence: 96,
    reasoning:
      'Learning a new skill is achievable for almost anyone with consistent practice. The main investment is time, not possibility.',
  },
  {
    pattern: /\b(automate|automation)\b/i,
    verdict: 'POSSIBLE',
    confidence: 88,
    reasoning:
      'Most repetitive digital tasks can be automated with scripts, APIs, or off-the-shelf tools. Feasibility depends mainly on whether the systems involved expose programmatic access.',
  },
  {
    pattern: /\b(lose|gain)\s+\d+\s*(kg|kilos?|lbs?|pounds?)\b/i,
    verdict: 'POSSIBLE',
    confidence: 85,
    reasoning:
      'Weight change is physiologically achievable for most people, though healthy rates are roughly 0.5-1 kg per week. Extreme targets on short timelines may be unsafe or unrealistic.',
  },
  // Ambitious but real
  {
    pattern: /\b(go|travel|fly)\s+to\s+(mars|the\s+moon|space)\b/i,
    verdict: 'UNCERTAIN',
    confidence: 60,
    reasoning:
      'Space travel exists, but access is limited to astronauts and a small number of private customers. Possible in principle, extremely constrained in practice.',
  },
  {
    pattern: /cure\s+(cancer|all\s+diseases?|aging)/i,
    verdict: 'UNCERTAIN',
    confidence: 55,
    reasoning:
      'Medical research is making real progress, but a universal cure does not exist today. Individual treatments improve constantly; a blanket cure remains an open research problem.',
  },
];

// Signals that push an otherwise-unknown request toward NOT_POSSIBLE
const HARD_BLOCKERS =
  /\b(zero\s+(time|money|effort)|without\s+(any\s+)?(work|effort|time|money)|overnight|in\s+(one|1)\s+(second|minute)\b)/i;

export function analyzeHeuristic(request: string): Verdict {
  const text = request.trim();

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return { ...pick(rule), engine: 'heuristic' };
    }
  }

  if (HARD_BLOCKERS.test(text)) {
    return {
      verdict: 'UNCERTAIN',
      confidence: 50,
      reasoning:
        'The goal itself may be achievable, but the constraint of near-zero time, money, or effort makes it unrealistic as stated. Relax the constraint and it likely becomes possible.',
      engine: 'heuristic',
    };
  }

  // Default: most human requests are possible with enough time and resources.
  return {
    verdict: 'POSSIBLE',
    confidence: 65,
    reasoning:
      'Nothing in this request violates physics, logic, or known hard limits. Most goals like this are achievable with the right time, resources, and plan. (Heuristic engine — set ANTHROPIC_API_KEY for a deeper AI assessment.)',
    engine: 'heuristic',
  };
}

function pick(rule: Rule): Omit<Verdict, 'engine'> {
  return { verdict: rule.verdict, confidence: rule.confidence, reasoning: rule.reasoning };
}
