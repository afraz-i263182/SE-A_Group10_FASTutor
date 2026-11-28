# FASTutor

**Learn from the seniors who've been there.**

FASTutor is a verified peer-tutoring website for FAST-NUCES Islamabad. Juniors search for a senior who aced their exact course, book a one-on-one or group session in person or online, and join Exam Rush revision nights before sessionals and finals. Every tutor is checked through their Flex transcript and official NU email.

## Theme

Theme #30: Tutor finder (Education)

**Site angle:** FASTutor is a Flex-verified peer-tutoring service that helps FAST-NUCES students find, book and learn from high-scoring seniors.

**Group:** SE-A, Group 10

## Links

- Live Website: https://afraz-i263182.github.io/SE-A_Group10_FASTutor/
- GitHub Repository: https://github.com/afraz-i263182/SE-A_Group10_FASTutor
- Google Form: https://docs.google.com/forms/d/11a30mr6qwiqZlrpUwUvUQC1ntEYaNiOuUgX-O-jD9K0/edit

## Site Map

| Page | File | Member |
|------|------|--------|
| Home | `index.html` | Afraz Hassan (26I-3182) |
| About & How it Works | `pages/about.html` | Afraz Hassan (26I-3182) |
| Help Center | `pages/help-center.html` | Afraz Hassan (26I-3182) |
| Study Tips | `pages/study-tips.html` | Kashan Shah (26I-3027) |
| Terms & Policies (Terms of Service, Privacy Policy, Student Guidelines) | `pages/terms.html` | Kashan Shah (26I-3027) |
| 404 Not Found | `pages/404.html` | Kashan Shah (26I-3027) |
| [TODO: pages of the remaining members] | | |

The header, navigation bar and footer are shared by every page (`css/style.css` and `js/script.js`).

## Feature Table

| Feature | Category | Page | Member |
|---------|----------|------|--------|
| Live course search with clear button and popular-course tags | Data & Display | Home | Afraz Hassan |
| Campus filter pills with active-filter banner, "no tutors found" message and reset | Data & Display | Home | Afraz Hassan |
| Department course cards that filter tutors on click or Enter/Space | Interaction | Home | Afraz Hassan |
| "How FASTutor works" student / senior-tutor toggle | Interaction | Home | Afraz Hassan |
| FAQ accordion (one answer open at a time) | Interaction | Home | Afraz Hassan |
| 3-step booking wizard (slot, mode, payment, NU email check, confirmation summary) | Forms & Input | Home | Afraz Hassan |
| Tutor application form with validation (name, NU email, CGPA 3.20 to 4.00, A/A- courses) | Forms & Input | Home | Afraz Hassan |
| Log in / Get Started form with email and password validation | Forms & Input | Home | Afraz Hassan |
| Modals with focus return, Esc and backdrop close, plus `?modal=` deep links from other pages | Responsive & Accessible | Home | Afraz Hassan |
| Sticky header, mobile hamburger menu (Esc closes) and active-link marking | Responsive & Accessible | All pages | Afraz Hassan |
| Student / senior-tutor tabs with 3-step route (keyboard arrows, `#tab-tutors` deep link) | Interaction | About & How it Works | Afraz Hassan |
| 1-on-1 Coaching / Group Sessions tabs with price card | Interaction | About & How it Works | Afraz Hassan |
| Tutor verification checklist whose ticks draw in on scroll (respects reduced motion) | Responsive & Accessible | About & How it Works | Afraz Hassan |
| Help search across FAQs and safety topics with result count, "no results" state and Esc to clear | Data & Display | Help Center | Afraz Hassan |
| FAQ category tabs (General, Groups, Exam Rush) with keyboard navigation and deep links | Interaction | Help Center | Afraz Hassan |
| Contact form with per-field validation and success message | Forms & Input | Help Center | Afraz Hassan |
| Study-tips category filter and article search with empty state | Data & Display | Study Tips | Kashan Shah |
| Article reader modal rendered from a JavaScript data object | Data & Display | Study Tips | Kashan Shah |
| Newsletter sign-up form with validation | Forms & Input | Study Tips | Kashan Shah |
| Terms / Privacy / Student Guidelines tabs with keyboard navigation and `?tab=` deep links | Interaction | Terms & Policies | Kashan Shah |
| Custom 404 page with "Back to FASTutor" and "Go back" actions | Interaction | 404 Not Found | Kashan Shah |
| [TODO: features of the remaining members] | | | |

## Contribution Table

| Name | Roll No | Pages Built | Features Built |
|------|---------|-------------|----------------|
| Afraz Hassan | 26I-3182 | Home, About & How it Works, Help Center | Course search and campus filters, course-card filtering, role toggle, FAQ accordion, booking wizard, tutor application form, log in form, accessible modals and mobile menu, About tabs and verification checklist, Help Center search, FAQ tabs and contact form |
| Kashan Shah | 26I-3027 | Study Tips, Terms & Policies, 404 Not Found | Article filter and search, article reader modal, newsletter form, policy tabs with deep links, custom 404 page |
| [TODO: full name] | 26I-3032 | [TODO] | [TODO] |
| [TODO: full name] | [TODO] | [TODO] | [TODO] |
| [TODO: full name] | [TODO] | [TODO] | [TODO] |

<!-- Add a sixth row if the group has 6 members. -->

## Built With

- HTML5 with semantic elements (`header`, `nav`, `main`, `section`, `footer`)
- CSS3 with a shared design system (CSS variables, Flexbox, Grid) and a stylesheet per page
- Vanilla JavaScript (no frameworks or libraries)
- Google Fonts (Plus Jakarta Sans, Inter) and Material Symbols icons
- Git and GitHub, one branch per member (named with the roll number), merged through pull requests

## Repository Structure

```
SE-A_Group10_FASTutor/
├── index.html              Home page
├── pages/                  About, Help Center, Study Tips, Terms, 404
├── css/                    style.css (shared) plus one stylesheet per page
├── js/                     script.js (shared) plus one script per page
├── docs/
│   ├── Prototype_and_Feedback_Report.pdf
│   ├── prototype-photos/
│   ├── feedback-photos/
│   └── ai-logs/<roll-number>/
└── README.md
```

## Run Locally

No build step is needed. Download or clone the repository and open `index.html` in a browser.

```
git clone https://github.com/afraz-i263182/SE-A_Group10_FASTutor.git
```

## Design Notes

- **Theme:** "Academic Executive" palette: Oxford navy, jade for trust and verification, honey gold for calls to action.
- **Responsive:** every page is designed for desktop and mobile widths.
- **Consistency:** all pages share one header, footer, colour palette, button set and FAQ/form components.