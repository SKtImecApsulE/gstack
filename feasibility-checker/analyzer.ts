// Heuristic feasibility analyzer — the zero-dependency fallback used when
// no ANTHROPIC_API_KEY is available. Pattern-scores the request against
// known impossibility classes and returns a structured verdict.

export interface Verdict {
  verdict: 'POSSIBLE' | 'NOT_POSSIBLE' | 'UNCERTAIN';
  confidence: number; // 0-100
  reasoning: string;
  advice: string; // how to make it possible, or the closest realistic alternative
  engine: 'heuristic' | 'claude';
}

interface Rule {
  pattern: RegExp;
  verdict: Verdict['verdict'];
  confidence: number;
  reasoning: string;
  advice: string;
}

const RULES: Rule[] = [
  // Wrong tool for the job (checked before the generic space rule below)
  {
    pattern: /\b(drive|driving|car|truck|bike|bicycle|motorbike|motorcycle|boat|petrol|diesel)\b.*\b(moon|mars|space|another\s+planet)\b|\b(moon|mars|space)\b.*\bin\s+(my|a|the)\s+(petrol\s+|diesel\s+|electric\s+)?(car|truck|bike|boat)\b/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 97,
    reasoning:
      'A ground vehicle cannot leave Earth: there is no road, a petrol engine needs atmospheric oxygen to burn fuel (space has none), and escaping Earth requires reaching about 11.2 km/s, roughly 200 times highway speed. Wheels and combustion engines are the wrong physics for the job.',
    advice:
      'The only vehicle that reaches the Moon is a rocket. Realistic paths: apply to a national astronaut program, watch for commercial lunar flyby seats (deep-pocketed and rare), or get the experience on the ground with a zero-g parabolic flight or a high-fidelity simulator. Your car is great for the drive to the launch viewing site.',
  },
  // Physically impossible
  {
    pattern: /perpetual\s+motion|infinite\s+energy|free\s+energy\s+machine|over.?unity/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 98,
    reasoning:
      'This violates the laws of thermodynamics. No machine can output more energy than it consumes, so perpetual motion and free-energy devices are physically impossible.',
    advice:
      'If the underlying goal is cheap or abundant energy, that IS achievable: solar panels, batteries, and heat pumps get you closer to "nearly free" energy than any perpetual-motion design ever will.',
  },
  {
    pattern: /faster\s+than\s+(the\s+speed\s+of\s+)?light|ftl\s+(travel|drive|communication)/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 97,
    reasoning:
      'Faster-than-light travel or communication violates special relativity as we currently understand it. No known physics permits it.',
    advice:
      'If the goal is faster communication or travel, work within the limit: light-speed links already circle Earth in ~130 ms, and for interplanetary dreams, ion propulsion and gravity assists are the real state of the art.',
  },
  {
    pattern: /time\s+travel|travel\s+(back|backwards?)\s+in\s+time|go\s+back\s+to\s+the\s+past/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 95,
    reasoning:
      'Backwards time travel has no known physical mechanism and creates causality paradoxes. Under current physics this is not possible.',
    advice:
      'If you want to revisit the past, the achievable versions are archives, photos, journals, and interviews with people who were there. If you want to fix a past mistake, that usually means a conversation in the present, not a time machine.',
  },
  {
    pattern: /teleport|teleportation/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 90,
    reasoning:
      'Teleportation of macroscopic objects or people is far beyond any known or foreseeable technology. Quantum teleportation transfers state, not matter.',
    advice:
      'If the goal is "be somewhere else instantly," the practical stand-ins are video calls, VR presence, and remote-controlled robots. For physical travel, a direct flight is still the fastest teleporter we have.',
  },
  {
    pattern: /bring\s+(back\s+)?(the\s+)?dead|resurrect|immortal(ity)?|live\s+forever|never\s+die/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 92,
    reasoning:
      'Reversing death or achieving true immortality is not possible with any current or foreseeable medical technology.',
    advice:
      'The achievable version is extending healthy lifespan: exercise, sleep, diet, and preventive screening are the interventions with real evidence. For preserving a legacy or memory, recordings, writing, and family archives genuinely work.',
  },
  // Logically impossible
  {
    pattern: /square\s+circle|married\s+bachelor|largest\s+(prime|number)\b|divide\s+by\s+zero/i,
    verdict: 'NOT_POSSIBLE',
    confidence: 99,
    reasoning:
      'This is logically or mathematically impossible: the request contradicts its own definitions.',
    advice:
      'Restate what you actually need without the contradiction. Usually there is a well-defined nearby question that does have an answer.',
  },
  // Clearly feasible software/everyday tasks
  {
    pattern: /\b(build|create|make|develop|design)\b.*\b(website|web\s*site|web\s*app|app|application|landing\s+page|api|bot|script|dashboard|game|blog|portfolio|store|extension)\b/i,
    verdict: 'POSSIBLE',
    confidence: 95,
    reasoning:
      'This is a standard software project. With modern tools and frameworks it is very achievable; scope and timeline are the only real variables.',
    advice:
      'Start with the smallest version that does the core job, ship it, then iterate. AI coding tools plus a modern framework can get a first working version live in days, not months. Define "done" for version one before you start.',
  },
  {
    pattern: /\b(learn|study)\b.*\b(language|coding|programming|python|javascript|guitar|piano|skill)\b/i,
    verdict: 'POSSIBLE',
    confidence: 96,
    reasoning:
      'Learning a new skill is achievable for almost anyone with consistent practice. The main investment is time, not possibility.',
    advice:
      'Consistency beats intensity: 30 focused minutes daily outperforms a weekend binge. Pick one structured resource, practice actively (build, speak, play — not just watch), and expect visible progress around the 6-8 week mark.',
  },
  {
    pattern: /\b(automate|automation)\b/i,
    verdict: 'POSSIBLE',
    confidence: 88,
    reasoning:
      'Most repetitive digital tasks can be automated with scripts, APIs, or off-the-shelf tools. Feasibility depends mainly on whether the systems involved expose programmatic access.',
    advice:
      'List the exact manual steps first, then check whether each system involved has an API or export. No-code tools (Zapier, Make) cover the common cases; a small script covers the rest.',
  },
  {
    pattern: /\b(lose|gain)\s+\d+\s*(kg|kilos?|lbs?|pounds?)\b/i,
    verdict: 'POSSIBLE',
    confidence: 85,
    reasoning:
      'Weight change is physiologically achievable for most people, though healthy rates are roughly 0.5-1 kg per week. Extreme targets on short timelines may be unsafe or unrealistic.',
    advice:
      'Set the timeline from the safe rate (0.5-1 kg per week), not the other way around. A sustainable calorie adjustment plus resistance training beats any crash approach, and a doctor should sign off on aggressive targets.',
  },
  // Ambitious but real
  {
    pattern: /\b(go|travel|fly)\s+to\s+(mars|the\s+moon|space)\b/i,
    verdict: 'UNCERTAIN',
    confidence: 60,
    reasoning:
      'Space travel exists, but access is limited to astronauts and a small number of private customers. Possible in principle, extremely constrained in practice.',
    advice:
      'Two real doors: the professional route (astronaut selection — competitive, but real people walk through it) and the customer route (suborbital seats exist today at six figures; orbital and lunar seats at eight). Zero-g flights are the affordable taste test.',
  },
  {
    pattern: /cure\s+(cancer|all\s+diseases?|aging)/i,
    verdict: 'UNCERTAIN',
    confidence: 55,
    reasoning:
      'Medical research is making real progress, but a universal cure does not exist today. Individual treatments improve constantly; a blanket cure remains an open research problem.',
    advice:
      'If this is personal, the levers that exist now are early screening, top-tier specialists, and clinical trials (clinicaltrials.gov lists open studies). If it is a mission, fund or join the research — progress is real, just incremental.',
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
      advice:
        'Decide which constraint is actually flexible — time, money, or effort — and loosen that one. "Slower but real" beats "instant but impossible."',
      engine: 'heuristic',
    };
  }

  // Default: most human requests are possible with enough time and resources.
  // Tailor the callout to the riskiest signal in the request.
  const hasDeadline =
    /\b(in|within|by)\s+(\d+\s*(hour|day|week|month|year)|tomorrow|tonight|next\s+(week|month|year))/i.test(text);
  const hasBudget = /\$|£|€|\b(budget|cheap|cheaply|free|no\s+money|afford)\b/i.test(text);

  let reasoning =
    'Verdict: doable. Nothing here breaks physics, logic, or the limits of current technology, ' +
    'which puts it in the category of things people actually pull off. The real question is not ' +
    '"can it be done" but "will the work get done."';
  if (hasDeadline) {
    reasoning +=
      ' Your timeline is the riskiest part: goals like this usually survive contact with reality, but schedules rarely do.';
  } else if (hasBudget) {
    reasoning +=
      ' Budget is the constraint to watch: price the honest version before you start, because cheap plans tend to cost double.';
  }

  return {
    verdict: 'POSSIBLE',
    confidence: 70,
    reasoning,
    advice:
      'Write down the first three concrete steps and put a date on step one. Then find one person or project that has already done something like this: copying a proven path beats inventing your own.',
    engine: 'heuristic',
  };
}

function pick(rule: Rule): Omit<Verdict, 'engine'> {
  return {
    verdict: rule.verdict,
    confidence: rule.confidence,
    reasoning: rule.reasoning,
    advice: rule.advice,
  };
}
