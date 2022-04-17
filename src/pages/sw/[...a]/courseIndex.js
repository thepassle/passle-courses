export const courseIndex = [
  // Chapter 0
  {
    title: 'Introduction',
    lessons: [
      {
        kind: 'theory',
        title: 'Introduction',
        markdownLocation: './sw/theory/introduction.md'
      },
      {
        kind: 'exercise',
        title: 'Exercise: Registering',
        validatorsLocation: './sw/registering/index.js'
      },
    ]
  },
  // Chapter 1
  {
    title: 'Caching strategies',
    lessons: [
      {
        kind: 'theory',
        title: 'Introduction to caching strategies',
        markdownLocation: './sw/theory/caching.md'
      },
      {
        kind: 'exercise',
        title: 'Exercise: caching',
        validatorsLocation: './sw/caching/index.js'
      },
      {
        kind: 'quiz',
        title: 'Quiz: Wrapping up',
        questions: [
          {
            question: 'When should you use a cache first strategy?',
            options: [
              'For content that updates frequently, like articles',
              'Resources where having the latest version is not essential, like avatars'
            ],
            answer: 0
          },
          {
            question: 'When should you use a cache only strategy?',
            options: [
              'For highly dynamic resources',
              'For static resources',
              'For user avatars'
            ],
            answer: 1
          },
        ]
      }
    ]
  },
  {
    title: 'Updating lifecycle',
    lessons: [
      {
        kind: 'theory',
        title: 'Service worker updates',
        markdownLocation: './sw/theory/caching.md'
      }
    ]
  },
  {
    title: 'Clients claim',
    lessons: [
      {
        kind: 'theory',
        title: 'Introduction to updates',
        markdownLocation: './sw/theory/caching.md'
      },
      {
        kind: 'theory',
        title: 'Clients claim',
        markdownLocation: './sw/theory/outro.md'
      }
    ]
  },
  {
    title: 'Skip waiting',
    lessons: [
      {
        kind: 'theory',
        title: 'Skip waiting',
        markdownLocation: './sw/theory/caching.md'
      }
    ]
  },
]