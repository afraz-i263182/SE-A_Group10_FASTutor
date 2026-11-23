(() => {
  const filters = [...document.querySelectorAll('.tips-filter')];
  const cards = [...document.querySelectorAll('.tips-article-card')];
  const featured = document.querySelector('.tips-featured');
  const search = document.querySelector('#article-search');
  const empty = document.querySelector('#tips-empty');
  let activeCategory = 'all';
  function update() {
    const query = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach(card => {
      const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
      const textMatch = !query || `${card.dataset.search || ''} ${card.textContent}`.toLowerCase().includes(query);
      const visible = categoryMatch && textMatch;
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (featured) {
      const categoryMatch = activeCategory === 'all' || featured.dataset.category === activeCategory;
      const textMatch = !query || `${featured.dataset.search || ''} ${featured.textContent}`.toLowerCase().includes(query);
      featured.hidden = !(categoryMatch && textMatch);
      if (!featured.hidden) shown++;
    }
    if (empty) empty.hidden = shown > 0;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filters.forEach(item => item.classList.toggle('is-active', item === button));
    update();
  }));
  search?.addEventListener('input', update);

  const articleContent = {
    revision: {title:'Build a revision plan you can actually follow',meta:'FASTutor Editorial · 6 min read',body:`<p>Start by listing what you need to cover. Divide each course into topics, then mark each topic as comfortable, shaky, or unfamiliar. This makes your plan honest and easier to prioritize.</p><h3>Try this simple sequence</h3><ul><li>Choose 2–3 concrete topics for the day instead of writing “study calculus.”</li><li>Start with a short recall attempt: write what you know without notes.</li><li>Use worked examples, then solve a similar problem on your own.</li><li>Leave a buffer block for topics that take longer than expected.</li><li>Finish with a quick recap and plan the next session.</li></ul><p>Make the plan small enough to complete. A consistent, realistic plan beats an ambitious schedule that collapses after day one.</p>`},
    recall:{title:'Active recall: test yourself before you feel ready',meta:'Hira · Senior tutor · 4 min read',body:`<p>Rereading feels productive because the material looks familiar. Active recall is different: close your notes and try to retrieve the idea from memory.</p><h3>Easy ways to practice</h3><ul><li>Turn headings into questions and answer them without looking.</li><li>After a lecture, write a short brain dump of the key ideas.</li><li>Use flashcards for definitions, formulas, and quick distinctions.</li><li>Check your answer, correct gaps, and retry later.</li></ul><p>Keep the retrieval attempts low-pressure. The point is to discover what you need to revisit—not to prove you already know everything.</p>`},
    pomodoro:{title:'Use the 25-minute focus sprint to beat procrastination',meta:'Hamza · Student mentor · 3 min read',body:`<p>When a task feels overwhelming, reduce the commitment. Set a timer for 25 minutes and work on one clear task until it rings. Then take a short break away from the screen.</p><h3>Make your sprint useful</h3><ul><li>Write the task before starting: “solve 3 practice questions,” not “do PF.”</li><li>Put your phone out of reach and close unrelated tabs.</li><li>During breaks, stretch, drink water, or walk a little.</li><li>After a few rounds, take a longer break.</li></ul><p>Adjust the interval if 25 minutes feels too long or too short. The timer is a tool—not a rule.</p>`},
    portfolio:{title:'Start building your portfolio before internship season',meta:'FASTutor Editorial · 5 min read',body:`<p>You don't need a huge project to begin. A small project that works, is clearly documented, and shows what you learned can demonstrate more than a long list of unfinished ideas.</p><h3>Make each project easy to understand</h3><ul><li>Pick a problem you can finish in a few weeks.</li><li>Write a short README with purpose, setup, features, and screenshots.</li><li>Commit changes regularly with clear messages.</li><li>Explain one challenge you solved and what you'd improve next.</li></ul><p>Keep your GitHub profile tidy and be ready to discuss the code honestly. Your understanding matters more than flashy features.</p>`},
    pf:{title:'Programming Fundamentals: practice with purpose',meta:'Ali · CS mentor · 7 min read',body:`<p>Programming improves with deliberate practice. Reading a solution can help you understand a technique, but tracing and writing code yourself makes the concepts stick.</p><h3>A repeatable practice routine</h3><ul><li>Trace a short program by hand and predict each variable.</li><li>Write the logic in plain language before coding.</li><li>Test normal, boundary, and unexpected inputs.</li><li>When stuck, inspect the smallest failing part instead of rewriting everything.</li><li>After fixing it, explain why the bug happened.</li></ul><p>Build up gradually: loops and conditions first, then arrays, functions, and larger problems that combine them.</p>`},
    week:{title:'Plan your week around deadlines—not vibes',meta:'Sana · Senior tutor · 4 min read',body:`<p>Look at your deadlines before assigning study sessions. A weekly view helps you see when assignments, quizzes, labs, and personal commitments collide.</p><h3>Use a quick weekly reset</h3><ul><li>List every due date and exam coming up.</li><li>Estimate how long each task will take.</li><li>Schedule the hardest or highest-priority work first.</li><li>Keep some open time for unexpected tasks.</li><li>Review the plan briefly each evening.</li></ul><p>Don't pack every hour. Leave space for meals, sleep, commuting, and downtime—those are part of a sustainable plan.</p>`},
    calculus:{title:'Calculus: stop memorizing solutions, learn the method',meta:'FASTutor Editorial · 5 min read',body:`<p>Memorizing a worked solution can help you recognize a question, but understanding the steps lets you handle variations. Focus on why each transformation is valid and which conditions make a method appropriate.</p><h3>Practice for understanding</h3><ul><li>Attempt a problem before looking at the solution.</li><li>Label the rule or concept used at each step.</li><li>After reviewing, close the solution and redo it from scratch.</li><li>Practice a slightly different version to test transfer.</li><li>Keep a list of mistakes and revisit them a few days later.</li></ul><p>Ask your tutor to explain the decision behind the method—not just the arithmetic.</p>`}
  };
  const modal = document.querySelector('#article-modal');
  const modalBody = document.querySelector('#article-modal-content');
  function openArticle(key){
    const article = articleContent[key]; if(!article || !modal || !modalBody) return;
    modalBody.innerHTML = `<h2 id="article-modal-title">${article.title}</h2><div class="modal-article-meta">${article.meta}</div>${article.body}`;
    modal.hidden = false; document.body.style.overflow = 'hidden'; document.querySelector('.article-modal-close')?.focus();
  }
  function closeArticle(){if(!modal)return;modal.hidden=true;document.body.style.overflow='';}
  document.querySelectorAll('[data-open-article]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openArticle(link.dataset.openArticle);}));
  modal?.querySelectorAll('[data-close-article]').forEach(el=>el.addEventListener('click',closeArticle));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal&&!modal.hidden)closeArticle();});
  const form = document.querySelector('#newsletter-form');
  const note = document.querySelector('#newsletter-note');
  form?.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;if(note)note.textContent='Thanks! Newsletter sign-up is a UI demo; no email was sent.';form.reset();});
  update();
})();
