'use strict';
/*
 * Sample curriculum: 3 age bands x 2 modules x 3 lessons = 18 lessons.
 * Each lesson is 10-15 minutes and mixes short reading, an interactive activity and a quiz.
 * Step types: read, quiz, sort, order, grid, train, prompt, spot, code, project.
 */

const TRACKS = {
  explorers: {
    id: 'explorers', name: 'Explorers', ages: '7–9', tagline: 'How tech works, and how to stay safe with it',
    summary: 'Unplugged thinking, first block-style puzzles, and a gentle first look at AI. Lots of doing, little reading.',
    outcomes: ['Explain what a computer and an algorithm are, in their own words', 'Give clear step-by-step instructions', 'Tell the difference between AI and ordinary tools', 'Know what is private and when to ask an adult'],
    modules: [
      { id: 'e1', title: 'Computers follow instructions', why: 'Every app and game starts with someone giving a computer clear steps. This is the foundation of coding.', lessons: ['e1-1', 'e1-2', 'e1-3'] },
      { id: 'e2', title: 'Meet AI, safely', why: 'Children already use AI in apps and games. Knowing that it learns from examples, and can be wrong, makes them smarter users.', lessons: ['e2-1', 'e2-2', 'e2-3'] },
    ],
  },
  makers: {
    id: 'makers', name: 'Makers', ages: '10–12', tagline: 'Think like a coder, design games, learn how AI learns',
    summary: 'Loops, conditions and game design, then how machine learning works and how to write good prompts.',
    outcomes: ['Use loops and if/then logic to solve puzzles', 'Plan a simple game with rules and a goal', 'Explain how AI learns from data, and why that can create bias', 'Write clear prompts and check AI answers for mistakes'],
    modules: [
      { id: 'm1', title: 'Think like a coder', why: 'Loops and conditions are the building blocks of every program. Planning a game turns them into something your child is proud of.', lessons: ['m1-1', 'm1-2', 'm1-3'] },
      { id: 'm2', title: 'How AI learns', why: 'AI tools are trained on examples. Understanding that helps children use them well and question their answers.', lessons: ['m2-1', 'm2-2', 'm2-3'] },
    ],
  },
  creators: {
    id: 'creators', name: 'Creators', ages: '13–16', tagline: 'Build real web pages and use AI responsibly',
    summary: 'Real HTML and CSS in the browser, how large language models work, prompt technique, and responsible AI.',
    outcomes: ['Build and style a web page with HTML and CSS', 'Explain how a large language model produces text', 'Write structured prompts and evaluate the output', 'Spot bias, misinformation and privacy risks in AI use'],
    modules: [
      { id: 'c1', title: 'Build for the web', why: 'HTML and CSS are the real languages of the web. Building a page is the fastest way to go from user to creator.', lessons: ['c1-1', 'c1-2', 'c1-3'] },
      { id: 'c2', title: 'AI: prompts and critical thinking', why: 'Teens will use AI for school and work. Using it well, and knowing its limits, is a career skill.', lessons: ['c2-1', 'c2-2', 'c2-3'] },
    ],
  },
};

const MISSION_POEM = {
  id: 'rainy-poem',
  goal: 'Get the AI to write a short, cheerful poem about the rainy season for a younger cousin.',
  keywords: ['rain', 'poem'],
  example: 'Write a 4-line cheerful poem about the rainy season in Lagos for a 7-year-old.',
  replies: {
    vague: 'Rain is water that falls from clouds. It happens in many places around the world and is part of the water cycle...\n\n(The AI guessed what you wanted and gave a fact, not a poem. It didn’t know who it was for or how long to make it.)',
    partial: 'Pitter, patter, rain comes down,\nSplashing puddles all through town,\nClouds are grey and skies are wide,\nWe watch the storm from safe inside.\n\n(Better! But the AI had to guess some details, like who the poem is for.)',
    strong: 'Drip-drop rain on Lagos streets,\nUmbrellas bloom in yellow sheets,\nWe jump the puddles, laugh and play,\nThen sunshine waves and ends the day!\n\n(A clear prompt gets a reply that fits: short, cheerful and right for a 7-year-old.)',
  },
};

const MISSION_EXPLAIN = {
  id: 'explain-photosynthesis',
  goal: 'Get the AI to explain photosynthesis to a 10-year-old in exactly 3 bullet points with one everyday example.',
  keywords: ['photosynthesis', 'plant'],
  example: 'Explain photosynthesis for a 10-year-old in 3 short bullet points, and include one example from a garden.',
  replies: {
    vague: 'Photosynthesis is the process by which autotrophic organisms convert light energy into chemical energy via chlorophyll, producing glucose and oxygen from carbon dioxide and water through the light-dependent reactions and the Calvin cycle...\n\n(Accurate, but far too advanced and long for the audience. The prompt didn’t say who it was for.)',
    partial: '- Plants make their own food using sunlight.\n- They take in water and a gas called carbon dioxide.\n- They give out oxygen, which we breathe.\n- This happens in the green parts of leaves.\n- It is very important for life on Earth.\n\n(Closer. But it gave 5 points and no everyday example, because the prompt didn’t ask for them.)',
    strong: '- Plants are like tiny kitchens: they use sunlight to cook their own food.\n- Their ingredients are water from the soil and air (carbon dioxide).\n- As they cook, they breathe out oxygen. A garden full of ugu leaves is quietly making fresh air for you!\n\n(Exactly 3 points, simple words, one everyday example. That’s a well-engineered prompt.)',
  },
};

const LESSONS = [
  // ---------------- EXPLORERS ----------------
  { id: 'e1-1', track: 'explorers', module: 'e1', title: 'What is a computer?', minutes: 10,
    summary: 'Find the computers hiding in everyday life.',
    steps: [
      { type: 'read', visual: 'devices', title: 'Computers are everywhere', body: ['A **computer** is a machine that takes in information, follows instructions, and gives back a result.', 'Phones, tablets, game consoles, POS machines at the shop and even some traffic lights have tiny computers inside.'] },
      { type: 'sort', title: 'Computer or not?', prompt: 'Does it have a computer inside?', buckets: ['Has a computer', 'No computer'], items: [
        { text: 'A smartphone', bucket: 0 }, { text: 'A mango', bucket: 1 }, { text: 'A POS card machine', bucket: 0 }, { text: 'A paper book', bucket: 1 }, { text: 'A smart TV', bucket: 0 }, { text: 'A wooden spoon', bucket: 1 } ] },
      { type: 'quiz', question: 'What does a computer need to do a job?', options: ['Instructions', 'Sunlight', 'Water'], answer: 0, explain: 'Computers can’t think for themselves. They follow instructions written by people.' },
    ] },
  { id: 'e1-2', track: 'explorers', module: 'e1', title: 'Algorithms are recipes', minutes: 12,
    summary: 'Learn that an algorithm is a list of steps in the right order.',
    steps: [
      { type: 'read', visual: 'recipe', title: 'Steps in order', body: ['An **algorithm** is a set of steps to finish a job, like a recipe.', 'The order matters! If you pour the tea before you boil the water, it won’t work.'] },
      { type: 'order', title: 'Brush your teeth', prompt: 'Put the steps in the right order.', items: ['Pick up your toothbrush', 'Put toothpaste on the brush', 'Brush all your teeth', 'Rinse your mouth', 'Wash and put away the brush'] },
      { type: 'quiz', question: 'Why does the order of steps matter in an algorithm?', options: ['It doesn’t matter', 'Steps in the wrong order can give the wrong result', 'Computers like long lists'], answer: 1, explain: 'Computers do exactly what you say, in the order you say it.' },
    ] },
  { id: 'e1-3', track: 'explorers', module: 'e1', title: 'Guide the kite home', minutes: 15,
    summary: 'Give a kite step-by-step directions through a grid.',
    steps: [
      { type: 'read', visual: 'grid', title: 'Your first program', body: ['You will write a tiny **program** using three commands: **Forward**, **Turn left** and **Turn right**.', 'Press **Run** to watch the kite follow your steps. If it goes wrong, change a step and try again. That’s called **debugging**.'] },
      { type: 'grid', title: 'Reach the star', size: 5, start: [0, 4], dir: 'up', goal: [2, 1], walls: [[1, 2], [0, 1]], allowRepeat: false },
      { type: 'project', title: 'Your own algorithm', brief: 'Write 4 or 5 steps for planting a seed in a pot. Number each step.', placeholder: '1. Fill the pot with soil\n2. ...' },
    ] },
  { id: 'e2-1', track: 'explorers', module: 'e2', title: 'What is AI?', minutes: 10, taster: true,
    summary: 'AI is a computer program that learns patterns from lots of examples.',
    steps: [
      { type: 'read', visual: 'pattern', title: 'Computers that learn from examples', body: ['**Artificial intelligence (AI)** is a kind of computer program that learns by looking at lots of examples and spotting **patterns**.', 'If it sees thousands of photos of cats, it starts to recognise cats. It doesn’t understand cats the way you do. It is matching patterns.'] },
      { type: 'sort', title: 'AI or not AI?', prompt: 'Does it learn from examples to make a guess?', buckets: ['Uses AI', 'Not AI'], items: [
        { text: 'A photo app that finds all the pictures of your dog', bucket: 0 }, { text: 'A light switch', bucket: 1 }, { text: 'A voice assistant that understands what you say', bucket: 0 }, { text: 'A calculator adding 2 + 2', bucket: 1 }, { text: 'A video app suggesting what to watch next', bucket: 0 } ] },
      { type: 'quiz', question: 'How does AI learn?', options: ['By reading your mind', 'From lots of examples', 'It already knows everything'], answer: 1, explain: 'AI learns patterns from examples, so it can also learn wrong things from bad examples.' },
      { type: 'quiz', question: 'Can AI make mistakes?', options: ['Yes, sometimes', 'No, never'], answer: 0, explain: 'AI makes guesses based on patterns. Guesses can be wrong, so we always check.' },
    ] },
  { id: 'e2-2', track: 'explorers', module: 'e2', title: 'Teach a machine', minutes: 15,
    summary: 'Train a tiny AI to sort pictures and see what happens when examples are missing.',
    steps: [
      { type: 'read', visual: 'pattern', title: 'You are the teacher', body: ['You are going to **train** a tiny AI to tell a **sun** from a **leaf**.', 'Label each picture. The AI will learn from your labels, then try to guess new pictures by itself.'] },
      { type: 'train', title: 'Train your sorter', labels: ['Sun', 'Leaf'],
        examples: [ { color: 'yellow', shape: 'round', label: 0 }, { color: 'orange', shape: 'round', label: 0 }, { color: 'yellow', shape: 'round', label: 0 }, { color: 'green', shape: 'pointy', label: 1 }, { color: 'green', shape: 'pointy', label: 1 }, { color: 'green', shape: 'round', label: 1 } ],
        tests: [ { color: 'orange', shape: 'round' }, { color: 'green', shape: 'pointy' }, { color: 'yellow', shape: 'pointy', tricky: true }, { color: 'brown', shape: 'pointy', tricky: true } ],
        lesson: 'Did your AI guess the tricky ones well? It never saw a yellow pointy shape or a brown leaf, so it had to guess. AI only knows what its examples taught it.' },
      { type: 'quiz', question: 'The AI never saw a brown leaf. What might happen?', options: ['It will always know it’s a leaf', 'It might guess wrong', 'It will ask a tree'], answer: 1, explain: 'When examples are missing, AI can get things wrong. Good AI needs lots of different examples.' },
    ] },
  { id: 'e2-3', track: 'explorers', module: 'e2', title: 'Safe and kind online', minutes: 12, badge: 'safety-star',
    summary: 'Know what to keep private and when to tell a trusted adult.',
    steps: [
      { type: 'read', visual: 'shield', title: 'Your private details are precious', body: ['Some information is **private**: your full name, home address, school, phone number, passwords and photos of you.', 'Never share these with apps, games, strangers or AI chatbots. If anything online makes you worried or uncomfortable, **tell a trusted adult**.'] },
      { type: 'sort', title: 'Share or keep private?', prompt: 'Is it OK to share online?', buckets: ['OK to share', 'Keep private'], items: [
        { text: 'Your favourite colour', bucket: 0 }, { text: 'Your home address', bucket: 1 }, { text: 'Your password', bucket: 1 }, { text: 'Your favourite food', bucket: 0 }, { text: 'The name of your school', bucket: 1 }, { text: 'A photo of your face', bucket: 1 } ] },
      { type: 'quiz', question: 'Someone in a game asks for your phone number. What do you do?', options: ['Give it to them', 'Don’t share it, and tell a trusted adult', 'Give them your friend’s number'], answer: 1, explain: 'You did the right thing. A trusted adult can help you block or report them.' },
    ] },

  // ---------------- MAKERS ----------------
  { id: 'm1-1', track: 'makers', module: 'm1', title: 'Loops save time', minutes: 12,
    summary: 'Use repeat blocks to write shorter, smarter programs.',
    steps: [
      { type: 'read', visual: 'loop', title: 'Don’t repeat yourself', body: ['A **loop** tells the computer to repeat something. Instead of writing "Forward, Forward, Forward", you can write **Forward ×3**.', 'Programmers use loops so their code is shorter and easier to fix.'] },
      { type: 'grid', title: 'Reach the star in 4 blocks or fewer', size: 5, start: [0, 4], dir: 'up', goal: [4, 0], walls: [[1, 1], [2, 1], [3, 1]], allowRepeat: true, maxBlocks: 4 },
      { type: 'quiz', question: 'Which is a loop?', options: ['Repeat 10 times: jump', 'Jump', 'If it rains, take an umbrella'], answer: 0, explain: '"Repeat" is a loop. The last one is a condition, which you’ll learn next.' },
    ] },
  { id: 'm1-2', track: 'makers', module: 'm1', title: 'If this, then that', minutes: 12,
    summary: 'Conditions let programs make decisions.',
    steps: [
      { type: 'read', visual: 'branch', title: 'Programs that decide', body: ['A **condition** checks if something is true, then chooses what to do: **if** it’s raining, **then** take an umbrella, **else** wear sunglasses.', 'Games are full of conditions: if the player touches a coin, add 1 point.'] },
      { type: 'sort', title: 'Condition or loop?', prompt: 'Which idea does each rule use?', buckets: ['Condition (if)', 'Loop (repeat)'], items: [
        { text: 'If the score reaches 10, show "You win!"', bucket: 0 }, { text: 'Spin the character 4 times', bucket: 1 }, { text: 'If the battery is low, show a warning', bucket: 0 }, { text: 'Play the song again and again', bucket: 1 }, { text: 'If the ball touches the floor, lose a life', bucket: 0 } ] },
      { type: 'quiz', question: 'In a game: "if the player touches lava, then ___". What fits best?', options: ['Lose a life', 'Repeat forever', 'Turn on the computer'], answer: 0, explain: 'The condition (touching lava) leads to an action (lose a life).' },
    ] },
  { id: 'm1-3', track: 'makers', module: 'm1', title: 'Design your own game', minutes: 15, badge: 'builder',
    summary: 'Plan a simple catch game with rules, a loop and conditions.',
    steps: [
      { type: 'read', visual: 'game', title: 'Every game has a plan', body: ['Game designers plan before they code. A plan answers: **Who is the player? What is the goal? What are the rules? How do you win or lose?**', 'Your rules will use what you learned: loops (things that keep happening) and conditions (if this, then that).'] },
      { type: 'order', title: 'Game loop order', prompt: 'Put this catch-game loop in order.', items: ['Drop a fruit from the top', 'Move the basket with the arrow keys', 'If the fruit touches the basket, add 1 point', 'If the fruit hits the ground, lose a life', 'Repeat until lives run out'] },
      { type: 'project', title: 'Your game plan', brief: 'Plan your own catch game. Write: the player, what falls, 2 rules using "if", and how you win.', placeholder: 'Player: a basket\nFalling things: ...\nRule 1: If ...\nRule 2: If ...\nWin: ...' },
    ] },
  { id: 'm2-1', track: 'makers', module: 'm2', title: 'Patterns and predictions', minutes: 15,
    summary: 'Train a model and discover how missing examples cause bias.',
    steps: [
      { type: 'read', visual: 'pattern', title: 'Training data', body: ['Machine learning models learn from **training data**: lots of labelled examples.', 'If the training data is missing some kinds of examples, the model will be worse at those. This is one cause of **bias** in AI.'] },
      { type: 'train', title: 'Train, then test', labels: ['Sun', 'Leaf'],
        examples: [ { color: 'yellow', shape: 'round', label: 0 }, { color: 'yellow', shape: 'round', label: 0 }, { color: 'orange', shape: 'round', label: 0 }, { color: 'green', shape: 'pointy', label: 1 }, { color: 'green', shape: 'pointy', label: 1 }, { color: 'green', shape: 'pointy', label: 1 } ],
        tests: [ { color: 'yellow', shape: 'round' }, { color: 'green', shape: 'pointy' }, { color: 'brown', shape: 'pointy', tricky: true }, { color: 'red', shape: 'pointy', tricky: true }, { color: 'green', shape: 'round', tricky: true } ],
        lesson: 'Your training data only had green leaves. Real leaves can be brown, red or round. The model learned "green = leaf", which is a biased shortcut. More varied data would make it fairer.' },
      { type: 'quiz', question: 'A face-unlock app was trained mostly on photos of adults. Who might it work worse for?', options: ['Adults', 'Children', 'Nobody'], answer: 1, explain: 'Groups missing from the training data are often where AI makes more mistakes.' },
    ] },
  { id: 'm2-2', track: 'makers', module: 'm2', title: 'Prompt writing 101', minutes: 15, badge: 'prompt-pro',
    summary: 'Write clear prompts: task, audience, format and detail.',
    steps: [
      { type: 'read', visual: 'prompt', title: 'Talking to AI clearly', body: ['A **prompt** is the instruction you give an AI. Vague prompts get vague answers.', 'Strong prompts have four parts: a **task** (write, explain, list), an **audience** (for a 7-year-old), a **format** (4 lines, 3 bullets) and a **detail** (about the rainy season in Lagos).'] },
      { type: 'prompt', title: 'Mission: rainy-season poem', mission: MISSION_POEM },
      { type: 'quiz', question: 'Which prompt is strongest?', options: ['Poem', 'Write a poem about rain', 'Write a 4-line funny poem about rain for my little brother'], answer: 2, explain: 'It has a task, a format, a style and an audience.' },
    ] },
  { id: 'm2-3', track: 'makers', module: 'm2', title: 'Is the AI right?', minutes: 12, badge: 'fact-checker',
    summary: 'AI can sound confident and still be wrong. Learn to check.',
    steps: [
      { type: 'read', visual: 'check', title: 'Confident is not the same as correct', body: ['AI chatbots predict words that sound right. Sometimes they make up facts. This is often called a **hallucination**.', 'Always check important facts with a trusted source: a textbook, a teacher, or an official website.'] },
      { type: 'spot', title: 'Find the mistakes', prompt: 'A learner asked: "Tell me 4 facts about Nigeria." Tap the sentences that are wrong.', sentences: [
        { text: 'Nigeria is in West Africa.', wrong: false },
        { text: 'The capital city of Nigeria is Lagos.', wrong: true, fix: 'The capital is Abuja (since 1991). Lagos is the largest city.' },
        { text: 'The River Niger flows through Nigeria.', wrong: false },
        { text: 'Nigeria’s flag is red and blue.', wrong: true, fix: 'The flag is green, white and green.' } ] },
      { type: 'quiz', question: 'An AI gives you a fact for your homework. What should you do?', options: ['Copy it straight away', 'Check it with a trusted source', 'Ask the AI if it’s sure, and trust the answer'], answer: 1, explain: 'Asking the AI again can produce the same mistake. Check somewhere reliable.' },
    ] },

  // ---------------- CREATORS ----------------
  { id: 'c1-1', track: 'creators', module: 'c1', title: 'How websites work', minutes: 10,
    summary: 'Browsers, servers, HTML, CSS and JavaScript in plain words.',
    steps: [
      { type: 'read', visual: 'web', title: 'Three languages of the web', body: ['A website is files stored on a **server**. Your **browser** downloads and shows them.', '**HTML** gives a page its structure (headings, paragraphs). **CSS** gives it style (colours, layout). **JavaScript** makes it interactive.'] },
      { type: 'order', title: 'What happens when you open a website?', prompt: 'Put the steps in order.', items: ['You type a web address and press Enter', 'The browser finds the server for that address', 'The server sends back HTML, CSS and JavaScript files', 'The browser draws the page on your screen'] },
      { type: 'quiz', question: 'Which language controls colours and layout?', options: ['HTML', 'CSS', 'JavaScript'], answer: 1, explain: 'CSS (Cascading Style Sheets) handles how things look.' },
    ] },
  { id: 'c1-2', track: 'creators', module: 'c1', title: 'Your first web page', minutes: 15,
    summary: 'Write real HTML and see it appear instantly.',
    steps: [
      { type: 'read', visual: 'code', title: 'Tags are labels', body: ['HTML uses **tags** in angle brackets. `<h1>` is a big heading, `<p>` is a paragraph, `<ul>` with `<li>` makes a list.', 'Most tags open and close: `<p>Hello</p>`. Tip: don’t put your real name or school on public pages.'] },
      { type: 'code', title: 'Build a page about a hobby', instructions: 'Change the heading to your hobby, write a paragraph about it, and add a list with at least 3 items.',
        starter: '<h1>My hobby</h1>\n<p>Write about your hobby here.</p>\n<ul>\n  <li>First thing I like</li>\n</ul>',
        checks: [ { re: '<h1>(?!\\s*My hobby\\s*</h1>)[^<]+</h1>', hint: 'Change the <h1> heading to name your hobby.' }, { re: '<p>(?!\\s*Write about your hobby here\\.\\s*</p>)[^<]{10,}</p>', hint: 'Write at least one sentence in the <p> paragraph.' }, { re: '(<li>[\\s\\S]*?</li>[\\s\\S]*?){3}', hint: 'Add at least 3 <li> items to the list.' } ] },
      { type: 'quiz', question: 'Which tag makes a list item?', options: ['<li>', '<list>', '<item>'], answer: 0, explain: '<li> means "list item". It goes inside <ul> or <ol>.' },
    ] },
  { id: 'c1-3', track: 'creators', module: 'c1', title: 'Style it with CSS', minutes: 15, badge: 'builder',
    summary: 'Add colours, fonts and spacing to make the page yours.',
    steps: [
      { type: 'read', visual: 'code', title: 'Selectors and properties', body: ['CSS rules pick an element and set properties: `h1 { color: teal; }`.', 'Useful properties: `color`, `background`, `font-family`, `padding`, `border-radius`.'] },
      { type: 'code', title: 'Make it look great', instructions: 'Inside <style>, give the body a background colour and change the h1 colour. Bonus: add padding.',
        starter: '<style>\n  body { font-family: sans-serif; }\n  h1 { }\n</style>\n<h1>My hobby</h1>\n<p>Style me!</p>',
        checks: [ { re: 'body\\s*\\{[^}]*background', hint: 'Add a background property to the body rule.' }, { re: 'h1\\s*\\{[^}]*color\\s*:', hint: 'Add a color property to the h1 rule.' } ] },
      { type: 'project', title: 'Plan your showcase page', brief: 'Describe a one-page site you’d like to build: its topic, 3 sections, and your colour choices. No personal details.', placeholder: 'Topic: ...\nSections: ...\nColours: ...' },
    ] },
  { id: 'c2-1', track: 'creators', module: 'c2', title: 'How language models work', minutes: 12,
    summary: 'Chatbots predict the next word. That explains both their power and their mistakes.',
    steps: [
      { type: 'read', visual: 'predict', title: 'Very good guessers', body: ['A **large language model (LLM)** is trained on huge amounts of text. It learns which words tend to follow others.', 'When you send a prompt, it predicts a likely reply one piece at a time. It doesn’t look facts up unless it is connected to a search tool, so it can be fluent and wrong at the same time.'] },
      { type: 'quiz', question: 'The sky is ___. What would a language model most likely predict next?', options: ['blue', 'sandwich', 'seventeen'], answer: 0, explain: '"Blue" follows "the sky is" most often in its training text. That’s prediction, not understanding.' },
      { type: 'quiz', question: 'Why can an LLM state a false fact confidently?', options: ['It is lying on purpose', 'It predicts likely-sounding text, which is not always true', 'It is broken'], answer: 1, explain: 'Plausible is not the same as true. That’s why we verify.' },
    ] },
  { id: 'c2-2', track: 'creators', module: 'c2', title: 'Prompt engineering', minutes: 15, badge: 'prompt-pro',
    summary: 'Structure prompts with task, audience, format and constraints.',
    steps: [
      { type: 'read', visual: 'prompt', title: 'A prompt is a brief', body: ['Write prompts like a brief to a helper: **task**, **audience**, **format**, and **constraints or details**.', 'Then iterate: read the answer, notice what’s missing, and refine the prompt.'] },
      { type: 'prompt', title: 'Mission: explain it simply', mission: MISSION_EXPLAIN },
      { type: 'quiz', question: 'The AI’s answer is too long. What’s the best fix?', options: ['Ask the same prompt again', 'Add a format limit, e.g. "in 3 bullet points"', 'Use capital letters'], answer: 1, explain: 'Constraints shape the output. Be specific about length and format.' },
    ] },
  { id: 'c2-3', track: 'creators', module: 'c2', title: 'Bias, privacy and misinformation', minutes: 15, badge: 'safety-star',
    summary: 'Use AI responsibly: protect privacy, question outputs, be honest.',
    steps: [
      { type: 'read', visual: 'shield', title: 'Responsible AI use', body: ['**Privacy:** anything you type may be stored. Never enter personal details about you or others.', '**Bias:** AI can repeat unfair patterns from its training data. **Misinformation:** AI can invent facts and sources. **Honesty:** say when you used AI, and follow your school’s rules.'] },
      { type: 'spot', title: 'Spot the problems', prompt: 'An AI answered: "Give me a study plan and tips for my science test." Tap the sentences you should question.', sentences: [
        { text: 'Study for 25 minutes, then take a 5-minute break.', wrong: false },
        { text: 'According to a 2023 Harvard study, students who study at midnight score 40% higher.', wrong: true, fix: 'A specific, surprising statistic with no link is a red flag. AI can invent studies. Verify before trusting it.' },
        { text: 'Tell me your full name and school, and I’ll make it personal.', wrong: true, fix: 'Never share personal details. A good plan doesn’t need them.' },
        { text: 'Test yourself with practice questions instead of only re-reading notes.', wrong: false } ] },
      { type: 'sort', title: 'Responsible or not?', prompt: 'Is this a responsible way to use AI?', buckets: ['Responsible', 'Not responsible'], items: [
        { text: 'Asking AI to explain a topic, then checking it in your textbook', bucket: 0 }, { text: 'Submitting an AI-written essay as your own', bucket: 1 }, { text: 'Uploading a friend’s photo to an AI app without asking', bucket: 1 }, { text: 'Using AI to brainstorm ideas, then choosing your own', bucket: 0 } ] },
      { type: 'project', title: 'AI rules for my family', brief: 'Write 4 rules your family could follow for using AI tools safely and honestly.', placeholder: '1. ...\n2. ...\n3. ...\n4. ...' },
    ] },
];

const LESSON_MAP = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

const BADGES = {
  'first-steps': { id: 'first-steps', name: 'First steps', desc: 'Finished your first lesson' },
  'prompt-pro': { id: 'prompt-pro', name: 'Prompt pro', desc: 'Wrote a strong prompt' },
  'fact-checker': { id: 'fact-checker', name: 'Fact checker', desc: 'Found every AI mistake' },
  'safety-star': { id: 'safety-star', name: 'Safety star', desc: 'Completed an online-safety lesson' },
  builder: { id: 'builder', name: 'Builder', desc: 'Finished a project lesson' },
};
for (const t of Object.values(TRACKS)) for (const m of t.modules) BADGES[`module-${m.id}`] = { id: `module-${m.id}`, name: m.title, desc: `Completed the "${m.title}" module` };

function trackLessons(trackId) {
  const t = TRACKS[trackId];
  return t ? t.modules.flatMap((m) => m.lessons.map((id) => LESSON_MAP[id])) : [];
}

function nextLesson(trackId, completedIds) {
  return trackLessons(trackId).find((l) => !completedIds.has(l.id)) || null;
}

module.exports = { TRACKS, LESSONS, LESSON_MAP, BADGES, trackLessons, nextLesson };
