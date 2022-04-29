export const courseIndex = {
  'sw': {
    chapters: [
      // Chapter 0
      {
        title: 'Introduction',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction',
            markdownLocation: './sw/theory/introduction.md'
          },
          {
            kind: 'exercise',
            title: 'Exercise: Registering',
            validatorsLocation: './sw/registering/index.js'
          },
          {
            kind: 'quiz',
            title: 'Quiz: Wrapping up',
            questions: [
              {
                question: 'During which lifecycle event should you be precaching assets?',
                options: [
                  'installing',
                  'activating',
                  'activated',
                  'redundant',
                ],
                answer: 0,
                explanation: 'Exactly! Good job'
              },
              {
                question: 'During which lifecycle event should you be cleaning up old caches?',
                options: [
                  'parsed',
                  'redundant',
                  'activating',
                  'installing'
                ],
                answer: 2
              },
            ]
          }
        ]
      },
      // Chapter 1
      {
        title: 'Caching strategies',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction to caching strategies',
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
                answer: 0,
                explanation: 'You should only use a cache first strategy for resources that are considered dependencies.'
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
            title: 'Theory: Service worker updates',
            markdownLocation: './sw/theory/caching.md'
          }
        ]
      },
      {
        title: 'Clients claim',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction to updates',
            markdownLocation: './sw/theory/caching.md'
          },
          {
            kind: 'theory',
            title: 'Theory: Clients claim',
            markdownLocation: './sw/theory/outro.md'
          }
        ]
      },
      {
        title: 'Skip waiting',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Skip waiting',
            markdownLocation: './sw/theory/caching.md'
          }
        ]
      },
    ]
  }
}