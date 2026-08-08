/* =========================================================================
   Farm4Glass — Prepared Event AI
   Rubric + penalty data for the DECA Guide 2026-27 prepared events.

   Covers:
     • Business Operations Research (BOR, BMOR, FOR, HTOR, SEOR)
     • Project Management (PMBS, PMCD, PMCA, PMCG, PMFL, PMSP)
     • Integrated Marketing Campaign (IMCE, IMCP, IMCS)

   Drop this file in next to script.js and load it BEFORE script.js:
     <script src="prepared-events.js"></script>
     <script src="script.js"></script>

   Exposes:
     window.PREPARED_EVENTS          — data
     window.getPreparedEvent(code)   — resolved event object (family merged in)
     window.listPreparedEvents()     — [{code, name, family, submission}] for the dropdown
     window.buildPreparedEventPrompt(code, documentText, meta) — {system, user}
     window.PREPARED_EVENT_SCHEMA    — the JSON shape the model must return
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     PENALTY POINT CHECKLIST  (DECA Guide 2026-27, p. 60)
     --------------------------------------------------------------------- */

  var PENALTIES = {
    writtenEntry: [
      {
        id: "WE1",
        rule: "The Prepared Event Statement of Assurances and Academic Integrity must be signed by all participants and the chapter advisor and placed in front of the written entry. Only physical or digital signatures are accepted — typed names in a font are not signatures.",
        points: 15,
        perUnit: false,
        aiCheckable: "partial",
        note: "Flag as 'cannot verify' if the uploaded file does not contain the statement page; remind the student it must be signed and placed first."
      },
      {
        id: "WE2",
        rule: "Limited to 20 pages, plus the title page and the table of contents. The appendix counts toward the 20.",
        points: 5,
        perUnit: true,
        perUnitLabel: "per page over the limit",
        aiCheckable: "yes"
      },
      {
        id: "WE3",
        rule: "All pages are numbered in sequence starting with the executive summary and ending with the final page of the appendix. Do not use separate pages between sections or as title pages for sections.",
        points: 5,
        perUnit: false,
        aiCheckable: "partial",
        note: "Divider/section title pages are a common violation — check for near-empty pages that only carry a section heading."
      },
      {
        id: "WE4",
        rule: "The written entry follows the outline in the Written Entry Guidelines for the event. Additional subsections are permitted in the body.",
        points: 5,
        perUnit: false,
        aiCheckable: "yes",
        note: "Missing, renamed, reordered, or merged required sections all trigger this."
      },
      {
        id: "WE5",
        rule: "The entry must be typed and use a page size of 8.5 x 11 inches. Handwritten corrections, notes, charts and graphs will be penalized.",
        points: 5,
        perUnit: false,
        aiCheckable: "partial"
      }
    ],

    pitchDeck: [
      {
        id: "PD1",
        rule: "The Prepared Event Statement of Assurances and Academic Integrity must be signed by all participants and the chapter advisor and turned in with the pitch deck. Only physical or digital signatures are accepted — typed names in a font are not signatures.",
        points: 15,
        perUnit: false,
        aiCheckable: "partial",
        note: "For IMC it is submitted as a SEPARATE document and is not included in slide numbering."
      },
      {
        id: "PD2",
        rule: "Limited to 20 slides, including the appendix.",
        points: 5,
        perUnit: true,
        perUnitLabel: "per slide over the limit",
        aiCheckable: "yes"
      },
      {
        id: "PD3",
        rule: "All slides are numbered in sequence starting with the title slide and ending with the final slide of the appendix.",
        points: 5,
        perUnit: false,
        aiCheckable: "partial"
      },
      {
        id: "PD4",
        rule: "The pitch deck follows the outline in the Pitch Deck Guidelines for the event. Additional subsections are permitted.",
        points: 5,
        perUnit: false,
        aiCheckable: "yes"
      },
      {
        id: "PD5",
        rule: "The pitch deck must be typed and use a 16:9 aspect ratio. Handwritten corrections, notes, charts and graphs will be penalized.",
        points: 5,
        perUnit: false,
        aiCheckable: "partial"
      }
    ],

    footnote:
      "A check indicates the item has been examined. A circled number indicates an infraction. If the entry must be submitted as a printed copy at district/region or association level, the student should consult their chartered association advisor about penalty points."
  };

  /* ---------------------------------------------------------------------
     SHARED PRESENTATION TECHNIQUE BLOCK
     Identical across all three families (5 pts each, 25 total).
     --------------------------------------------------------------------- */

  var TECHNIQUE = [
    {
      name: "Organization",
      criterion: "Information is presented in a logical sequence that can be easily followed and understood.",
      bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
      max: 5
    },
    {
      name: "Effectiveness",
      criterion: "Presentation effectively persuades, informs, or inspires by communicating a clear message.",
      bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
      max: 5
    },
    {
      name: "Delivery",
      criterion: "Presentation engages the audience through interactive techniques (e.g., visual storytelling).",
      bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
      max: 5
    },
    {
      name: "Presentation Design",
      criterion: "Visual aids and themes are used throughout and are appropriate, professional, and add value to the presentation.",
      bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
      max: 5
    },
    {
      name: "Overall Impression",
      criterion: "Demonstrates overall career readiness through professionalism, poise and confidence.",
      bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
      max: 5
    }
  ];

  /* ---------------------------------------------------------------------
     FAMILY 1 — BUSINESS OPERATIONS RESEARCH  (pp. 62-67)
     --------------------------------------------------------------------- */

  var ORS = {
    id: "ORS",
    name: "Business Operations Research Events",
    submission: "writtenEntry",
    participants: "1-3 members; all participants must present",
    pageLimit: 20,
    pageLimitNote: "20 numbered pages including the appendix, excluding the title page and table of contents",
    presentationMinutes: 15,
    scoring: "Written entry 100 pts + presentation 100 pts = 200 pts, less penalty points",
    role:
      "Participants assume the role of hired consultants. The judge assumes the role of the owner/manager of the business or organization.",
    topic2627:
      "Collaborate with a local business or organization to research what drives customer loyalty and repeat engagement. Using the research findings, develop a strategic plan to strengthen customer retention through loyalty programs, personalized experiences or relationship-building initiatives.",

    outline: [
      {
        num: "I",
        title: "EXECUTIVE SUMMARY",
        detail: "One- to three-page description of the project."
      },
      {
        num: "II",
        title: "INTRODUCTION",
        sub: [
          "A. Description of the business or organization, including its purpose",
          "B. Description of the primary products or services",
          "C. Description of the target market (demographics and psychographics)",
          "D. Overview of the organization's current business strategy relating to customer loyalty and repeat engagement"
        ]
      },
      {
        num: "III",
        title: "RESEARCH METHODS USED IN THE STUDY",
        sub: [
          "A. Description and rationale of research methodologies selected",
          "B. Process used to conduct the selected research methods"
        ]
      },
      {
        num: "IV",
        title: "FINDINGS AND CONCLUSIONS OF THE STUDY",
        sub: ["A. Findings of the research study", "B. Conclusions based on the findings"]
      },
      {
        num: "V",
        title: "PROPOSED STRATEGIC PLAN",
        sub: [
          "A. Objectives and rationale of the proposed strategic plan",
          "B. Proposed activities and timelines",
          "C. Proposed metrics or key performance indicators to measure plan effectiveness"
        ]
      },
      {
        num: "VI",
        title: "PROPOSED BUDGET",
        detail:
          "Costs and rationale associated with proposed strategies, financial viability and ROI."
      },
      { num: "VII", title: "BIBLIOGRAPHY", detail: "Required." },
      {
        num: "VIII",
        title: "APPENDIX",
        detail: "Optional. All appendix pages are numbered and count toward the 20-page limit."
      }
    ],

    frontMatter: [
      "Prepared Event Statement of Assurances and Academic Integrity — signed, in front, not page-numbered",
      "Title page — event name, high school, school address, city/state/ZIP, participant names, date. Not numbered.",
      "Table of contents — follows the title page, may be single-spaced and more than one page. Not numbered.",
      "Body begins at Section I, Executive Summary, numbered page 1."
    ],

    writtenRubric: {
      totalPoints: 100,
      sections: [
        {
          section: "Executive Summary",
          items: [
            {
              n: 1,
              criterion:
                "A clear, concise and well-structured executive summary (one to three pages) covering key aspects of the project.",
              bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
              max: 10
            }
          ]
        },
        {
          section: "Introduction",
          items: [
            {
              n: 2,
              criterion:
                "Description of the business or organization including its primary products or services, purpose/mission, target market and current business strategy.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            }
          ]
        },
        {
          section: "Research Methods Used in the Study",
          items: [
            {
              n: 3,
              criterion:
                "Description and rationale of the research methodologies (qualitative, quantitative, primary, secondary) in relation to the study's goals and research topic, with a clear explanation of the data collection process.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            },
            {
              n: 4,
              criterion:
                "Conducts, implements, and executes the selected research methods in a clear, organized and professional manner. The research methods are easy to understand, logical, and thorough.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            }
          ]
        },
        {
          section: "Findings and Conclusions of the Study",
          items: [
            {
              n: 5,
              criterion:
                "Interprets and connects the research findings to the study's objectives and questions, demonstrating clarity, understanding, and support for the objectives.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            },
            {
              n: 6,
              criterion:
                "Draws logical, evidence-based conclusions that are supported by the research findings.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            }
          ]
        },
        {
          section: "Proposed Strategic Plan",
          items: [
            {
              n: 7,
              criterion:
                "Proposes actionable objectives and provides a practical rationale for the proposed strategic plan based on data, research, and logical analysis.",
              bands: { novice: [0, 3], developing: [4, 7], proficient: [8, 11], exemplary: [12, 12] },
              max: 12
            },
            {
              n: 8,
              criterion:
                "Proposes actionable, logical strategic activities with realistic timelines to support the implementation of the strategic plan.",
              bands: { novice: [0, 3], developing: [4, 7], proficient: [8, 11], exemplary: [12, 12] },
              max: 12
            },
            {
              n: 9,
              criterion:
                "Proposes effective metrics or key performance indicators to measure the plan's effectiveness.",
              bands: { novice: [0, 3], developing: [4, 7], proficient: [8, 11], exemplary: [12, 12] },
              max: 12
            }
          ]
        },
        {
          section: "Proposed Budget",
          items: [
            {
              n: 10,
              criterion:
                "Evaluates and justifies the financial costs of the proposed strategies, identifies all costs, explains the cost rationale, addresses financial viability, and considers potential ROI/financial benefits.",
              bands: { novice: [0, 2], developing: [3, 5], proficient: [6, 7], exemplary: [8, 8] },
              max: 8
            }
          ]
        },
        {
          section: "Professional Standards",
          items: [
            {
              n: 11,
              criterion:
                "Displays a professional layout using appropriate business language and correct grammar.",
              bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 5], exemplary: [6, 6] },
              max: 6
            }
          ]
        }
      ]
    },

    presentationRubric: {
      totalPoints: 100,
      content: [
        {
          n: 1,
          name: "Business Need, Process and Methodology",
          criterion:
            "Explains the business need, data collection and tools process, and research methods related to the project's goals.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 2,
          name: "Key Findings",
          criterion:
            "Accurately interprets research findings and draws logical, evidence-based conclusions that are supported by the data.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 3,
          name: "Proposed Strategic Plan",
          criterion:
            "Proposes feasible strategic actions and solutions based on data and analysis that effectively solve the business need.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 4,
          name: "Proposed Budget",
          criterion:
            "Justifies strategy costs, identifies key expenses, and addresses financial viability and ROI.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 5,
          name: "Impact and Measurement",
          criterion:
            "Proposes relevant metrics/key indicators to capture and measure the results and effectiveness of the solution.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        }
      ],
      technique: TECHNIQUE
    },

    events: [
      {
        code: "BOR",
        name: "Business Services Operations Research",
        cluster: "Business Services",
        clusterDef:
          "Providing services to businesses on a fee or contract basis, or services to consumers — e.g. HR companies, IT companies, legal services, training and development, health care service providers, libraries, construction, real estate, landscaping, salons, car washes, auto repair, interior decorating, child care, photography, tutoring."
      },
      {
        code: "BMOR",
        name: "Buying and Merchandising Operations Research",
        cluster: "Buying and Merchandising",
        clusterDef:
          "Getting the product into the hands of the customer through forecasting, planning, buying, displaying, selling and customer service — e.g. specialty stores, department stores, malls, grocery, convenience stores, pharmacies, discount stores, farmers markets, car dealerships."
      },
      {
        code: "FOR",
        name: "Finance Operations Research",
        cluster: "Finance",
        clusterDef:
          "Providing financial services to commercial and retail customers — e.g. banks, credit unions, accounting firms, investment companies, insurance companies."
      },
      {
        code: "HTOR",
        name: "Hospitality and Tourism Operations Research",
        cluster: "Hospitality and Tourism",
        clusterDef:
          "Products and services related to event management, lodging, restaurant management, and travel and tourism — e.g. hotels, convention services, food and beverage, restaurants, museums, amusement parks, zoos."
      },
      {
        code: "SEOR",
        name: "Sports and Entertainment Marketing Operations Research",
        cluster: "Sports and Entertainment Marketing",
        clusterDef:
          "Products, services or experiences relating to amateur or professional sports, entertainment or entertainment events, or recreational supplies and equipment — e.g. sports teams, movie theaters, waterparks, music venues, concerts, festivals, tournaments, summer camps, outdoor adventure companies."
      }
    ]
  };

  /* ---------------------------------------------------------------------
     FAMILY 2 — PROJECT MANAGEMENT  (pp. 68-73)
     --------------------------------------------------------------------- */

  var PM = {
    id: "PM",
    name: "Project Management Events",
    submission: "writtenEntry",
    participants: "1-3 members; all participants must present",
    pageLimit: 20,
    pageLimitNote:
      "20 numbered pages including the appendix, excluding the title page and table of contents",
    presentationMinutes: 15,
    scoring: "Written entry 100 pts + presentation 100 pts = 200 pts, less penalty points",
    role: "Participants assume the role of project managers.",
    window:
      "The project may begin any time after the close of the previous year's chartered association conference and run to the beginning of the next chartered association conference.",
    originality:
      "Teams should do more than update the previous year's project; committees should avoid even reviewing the prior entry. Plagiarism of previously judged projects automatically disqualifies a chapter. Projects may be submitted in only one event category.",

    outline: [
      { num: "I", title: "EXECUTIVE SUMMARY", detail: "One- to three-page description of the project." },
      {
        num: "II",
        title: "INITIATING",
        sub: [
          "A. Statement of the need/opportunity",
          "B. Project scope — brief description of the project (purpose, rationale and expected benefits)"
        ]
      },
      {
        num: "III",
        title: "PLANNING AND ORGANIZING",
        sub: [
          "A. Project goals",
          "B. Human resource management plan — team member roles, skills, strengths and responsibilities",
          "C. Schedule — (i) 2-4 major milestones, (ii) timeline to reach each milestone",
          "D. Quality management plan — key metrics",
          "E. Risk management plan — potential issues, potential impact, response strategy",
          "F. Proposed project budget — include both monetary and in-kind donations when applicable"
        ]
      },
      {
        num: "IV",
        title: "EXECUTION",
        detail: "Description and documentation of the project plan implementation."
      },
      {
        num: "V",
        title: "MONITORING AND CONTROLLING",
        sub: [
          "A. Monitoring — how you monitored schedule, budget and project quality",
          "B. Controlling — issues encountered and how you dealt with them"
        ]
      },
      {
        num: "VI",
        title: "CLOSING THE PROJECT",
        sub: [
          "A. Evaluation of key metrics",
          "B. Lessons learned — what worked and what didn't for each process: initiating, planning and organizing, execution, monitoring and controlling",
          "C. Recommendations for future projects"
        ]
      },
      { num: "VII", title: "BIBLIOGRAPHY", detail: "Required." },
      {
        num: "VIII",
        title: "APPENDIX",
        detail: "Optional. All appendix pages are numbered and count toward the 20-page limit."
      }
    ],

    frontMatter: [
      "Prepared Event Statement of Assurances and Academic Integrity — signed, not page-numbered",
      "Title page — event name, high school, school address, city/state/ZIP, participant names, date. Not numbered.",
      "Table of contents — follows the title page, may be single-spaced and more than one page. Not numbered.",
      "Body begins at Section I, Executive Summary, numbered page 1."
    ],

    writtenRubric: {
      totalPoints: 100,
      sections: [
        {
          section: "Executive Summary",
          items: [
            {
              n: 1,
              criterion:
                "A clear, concise and well-structured executive summary (one to three pages) covering all key aspects of the project.",
              bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
              max: 10
            }
          ]
        },
        {
          section: "Initiating",
          items: [
            {
              n: 2,
              criterion:
                "Clearly defines the need/opportunity and articulates the project scope in a way that reflects both depth of understanding and real-world relevance.",
              bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
              max: 10
            }
          ]
        },
        {
          section: "Planning and Organizing",
          items: [
            {
              n: 3,
              criterion:
                "Develops and justifies interconnected project components (goals, HR plan, schedule, quality, risk, and budget) demonstrating strategic foresight, prioritization, and alignment with project goals.",
              bands: { novice: [0, 7], developing: [8, 13], proficient: [14, 19], exemplary: [20, 20] },
              max: 20
            }
          ]
        },
        {
          section: "Execution",
          items: [
            {
              n: 4,
              criterion:
                "Provides a compelling, well-supported narrative and documentation of how the plan was implemented, highlighting team coordination, adaptation, and decision-making in action.",
              bands: { novice: [0, 7], developing: [8, 13], proficient: [14, 19], exemplary: [20, 20] },
              max: 20
            }
          ]
        },
        {
          section: "Monitoring and Controlling",
          items: [
            {
              n: 5,
              criterion:
                "Demonstrates how feedback, data, and checkpoints were actively used to assess progress, resolve challenges, and maintain alignment to goals across schedule, quality, and budget.",
              bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
              max: 10
            }
          ]
        },
        {
          section: "Closing the Project",
          items: [
            {
              n: 6,
              criterion:
                "Evaluates the overall success of the project using key metrics, extracts lessons learned with insight, and offers forward-thinking recommendations that show strategic reflection.",
              bands: { novice: [0, 7], developing: [8, 13], proficient: [14, 19], exemplary: [20, 20] },
              max: 20
            }
          ]
        },
        {
          section: "Professional Standards",
          items: [
            {
              n: 7,
              criterion:
                "Displays a professional layout using appropriate business language and correct grammar.",
              bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
              max: 10
            }
          ]
        }
      ]
    },

    presentationRubric: {
      totalPoints: 100,
      content: [
        {
          n: 1,
          name: "Initiating",
          criterion:
            "Provides clear and logical rationale for the project describing the need or opportunity the project addresses.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 2,
          name: "Planning and Organizing",
          criterion:
            "Demonstrates a well-structured project plan that aligns goals, timelines, roles, resources, and risk management strategies to ensure cohesive implementation.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 3,
          name: "Execution",
          criterion:
            "Effectively implements the project plan through coordinated action, progress monitoring, problem-solving, and documented evidence of completed tasks.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 4,
          name: "Monitoring and Controlling",
          criterion:
            "Demonstrates how feedback, data, and checkpoints were actively used to assess progress, resolve challenges, and maintain alignment to goals across schedule, quality, and budget.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 5,
          name: "Closing the Project",
          criterion:
            "Demonstrates use of evaluation techniques to provide meaningful measures of success (KPIs, impact data), variances, challenges, and future recommendations.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        }
      ],
      technique: TECHNIQUE
    },

    events: [
      {
        code: "PMBS",
        name: "Business Solutions Project",
        cluster: "Business Solutions",
        clusterDef:
          "Uses the project management process to work with a local business or organization to identify a specific problem with current business operations and implement a solution — e.g. talent acquisition, employee onboarding, policies and procedures, technology integration, customer service improvement, safety operations, marketing and promotion activities, productivity and output enhancement."
      },
      {
        code: "PMCD",
        name: "Career Development Project",
        cluster: "Career Development",
        clusterDef:
          "Promotes or educates the knowledge and skills needed for careers in marketing, finance, hospitality, management and entrepreneurship — e.g. career fairs, summer boot camps, professional dress seminars, résumé workshops, career exploration initiatives, mock interviews, workplace re-entry and mentor programs."
      },
      {
        code: "PMCA",
        name: "Community Awareness Project",
        cluster: "Community Awareness",
        clusterDef:
          "Raises awareness for a community issue or cause — e.g. day of service, distracted driving, driving under the influence, bullying, disease awareness, mental health awareness, drug awareness, ethics, environmental and green issues, vaping."
      },
      {
        code: "PMCG",
        name: "Community Giving Project",
        cluster: "Community Giving",
        clusterDef:
          "Raises funds or collects donations to be given to a cause/charity — e.g. food bank donations, homeless shelter donations, 5Ks, sports tournaments, auctions, banquets, item collections, holiday drives, adopt-a-family events."
      },
      {
        code: "PMFL",
        name: "Financial Literacy Project",
        cluster: "Financial Literacy",
        clusterDef:
          "Promotes the importance of financial literacy — spending and saving, credit and debt, employment and income, investing, risk and insurance, financial decision making. Examples include seminars for students, tax preparation assistance, retirement planning and student loan workshops."
      },
      {
        code: "PMSP",
        name: "Sales Project",
        cluster: "Sales Project",
        clusterDef:
          "Raises funds for the local DECA chapter — e.g. sports tournaments, t-shirt sales, 5Ks, school merchandise sales, catalog sales, sponsorship development initiatives, fashion shows, pageants, restaurant nights, value cards, yearbook sales."
      }
    ]
  };

  /* ---------------------------------------------------------------------
     FAMILY 3 — INTEGRATED MARKETING CAMPAIGN  (pp. 105-108)
     --------------------------------------------------------------------- */

  var IMC = {
    id: "IMC",
    name: "Integrated Marketing Campaign Events",
    submission: "pitchDeck",
    participants: "1-3 members; all participants must present and respond to questions",
    slideLimit: 20,
    slideLimitNote: "20 slides including the appendix",
    presentationMinutes: 15,
    exam:
      "100-question multiple-choice cluster exam covering Business Administration Core and Marketing Cluster performance indicators. Team scores are averaged. The exam score carries forward into the final round.",
    scoring:
      "Presentation evaluation is 100 pts and is weighted TWICE the value of the exam score. There is no separate written-entry evaluation form — the pitch deck is scored through the presentation form.",
    role:
      "Participants assume the role of account manager(s) at a marketing agency. The judge assumes the role of a prospective client assessing campaign proposals.",
    campaignLength: "The campaign must be no more than 45 days in length, for a real event, product or service.",

    slideNumbering: [
      "Cover slide — first slide; does not need to be numbered '1'.",
      "Title slide — numbered '2'; event name, high school, school address, city/state/ZIP, participant names, date.",
      "Table of contents — numbered '3'; must be only one slide.",
      "Body begins at Section I, Overview, numbered '4'. Numbering continues through the bibliography and appendix.",
      "The Statement of Assurances is submitted as a SEPARATE document and is not included in the numbering."
    ],

    outline: [
      {
        num: "I",
        title: "OVERVIEW",
        detail: "One-slide description of the campaign, including the business opportunity it addresses."
      },
      { num: "II", title: "DESCRIPTION OF THE EVENT, PRODUCT OR SERVICE AND ITS COMPANY" },
      { num: "III", title: "CAMPAIGN OBJECTIVES" },
      { num: "IV", title: "CAMPAIGN TARGET MARKET" },
      {
        num: "V",
        title: "RESEARCH, INSIGHTS, CONNECTION TO THE CAMPAIGN",
        detail:
          "Research on influences (cultural, social, economic, technological) and media consumption patterns that shape audience behavior; include how the findings inform the campaign strategy, activities and schedule."
      },
      {
        num: "VI",
        title: "CAMPAIGN STRATEGY, ACTIVITIES AND SCHEDULE",
        detail:
          "Campaign activities of no more than 45 days with timelines and channels; include creative samples of suggested marketing collateral."
      },
      {
        num: "VII",
        title: "PROPOSED BUDGET",
        detail: "Detailed projections of campaign costs including key expenses and financial viability."
      },
      {
        num: "VIII",
        title: "IMPACT AND MEASUREMENT",
        detail: "Key performance indicators that will be used to measure campaign success."
      },
      { num: "IX", title: "BIBLIOGRAPHY", detail: "Required." },
      {
        num: "X",
        title: "APPENDIX",
        detail: "Optional. All appendix slides are numbered and count toward the 20-slide limit."
      }
    ],

    writtenRubric: null,

    presentationRubric: {
      totalPoints: 100,
      content: [
        {
          n: 1,
          name: "Knowledge of Industry/Brand",
          criterion:
            "Clear, thorough understanding of the industry, the organization, product or service, and its position within its industry.",
          bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
          max: 5
        },
        {
          n: 2,
          name: "Business Opportunity",
          criterion: "Explains the business opportunity, goals and objectives, and the target market.",
          bands: { novice: [0, 1], developing: [2, 3], proficient: [4, 4], exemplary: [5, 5] },
          max: 5
        },
        {
          n: 3,
          name: "Research, Insights and Connection to Campaign",
          criterion:
            "Explains the research method, results, and how the findings inform the next steps.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 4,
          name: "Campaign Strategy",
          criterion:
            "Proposes feasible ideas and solutions based on data and analysis that effectively solve the business opportunity using creativity and innovative ideas/concepts.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 5,
          name: "Campaign Activities and Schedule",
          criterion:
            "Outlines actionable strategic activities with realistic timelines, and aligns target market(s), channels and activities.",
          bands: { novice: [0, 5], developing: [6, 10], proficient: [11, 14], exemplary: [15, 15] },
          max: 15
        },
        {
          n: 6,
          name: "Proposed Budget",
          criterion:
            "Justifies campaign costs, identifies key expenses, and addresses financial viability.",
          bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
          max: 10
        },
        {
          n: 7,
          name: "Impact and Measurement",
          criterion:
            "Proposes relevant metrics/key indicators to capture and measure the results and effectiveness of the campaign.",
          bands: { novice: [0, 3], developing: [4, 6], proficient: [7, 9], exemplary: [10, 10] },
          max: 10
        }
      ],
      technique: TECHNIQUE
    },

    events: [
      {
        code: "IMCE",
        name: "Integrated Marketing Campaign — Event",
        cluster: "Event",
        clusterDef:
          "A campaign related to any sports and entertainment event and/or company event — e.g. concerts, festivals, fairs, tournaments, pet adoption day, charity events."
      },
      {
        code: "IMCP",
        name: "Integrated Marketing Campaign — Product",
        cluster: "Product",
        clusterDef:
          "A campaign related to any hard/soft line retail product including e-commerce — e.g. apparel and accessories, retail products."
      },
      {
        code: "IMCS",
        name: "Integrated Marketing Campaign — Service",
        cluster: "Service",
        clusterDef:
          "A campaign related to any service or intangible product — e.g. pet services, golf lessons, health care services, salons, restaurants, amusement parks."
      }
    ]
  };

  /* ---------------------------------------------------------------------
     PRESENTATION LOGISTICS — shared across all three families
     --------------------------------------------------------------------- */

  var PRESENTATION_RULES = [
    "The presentation begins immediately after the adult assistant introduces the participants to the judge.",
    "Each participant must take part in the presentation.",
    "Each participant may bring a copy of the entry or note cards to reference during the presentation.",
    "Only hand-carried visual aids are permitted. Participants set up their own visuals; wheeled carts, moving straps or similar are not allowed. Set-up time counts against the 15 minutes.",
    "Participants furnish their own materials and equipment. No electrical power or internet is supplied, and alternate power sources such as generators are not allowed. Sound may be used at a conversational volume.",
    "Materials may be handed to or left with judges. Items of monetary value may be handed to but not left with judges. Flyers, brochures, pamphlets and business cards may be left. No food or drinks.",
    "If any rule is violated, the judge must notify the adult assistant."
  ];

  /* ---------------------------------------------------------------------
     PUBLIC DATA OBJECT
     --------------------------------------------------------------------- */

  var PREPARED_EVENTS = {
    guide: "DECA Guide 2026-27",
    penalties: PENALTIES,
    presentationRules: PRESENTATION_RULES,
    families: { ORS: ORS, PM: PM, IMC: IMC }
  };

  /* ---------------------------------------------------------------------
     LOOKUPS
     --------------------------------------------------------------------- */

  function listPreparedEvents() {
    var out = [];
    Object.keys(PREPARED_EVENTS.families).forEach(function (fid) {
      var fam = PREPARED_EVENTS.families[fid];
      fam.events.forEach(function (ev) {
        out.push({
          code: ev.code,
          name: ev.name,
          family: fam.name,
          familyId: fid,
          submission: fam.submission
        });
      });
    });
    return out;
  }

  function getPreparedEvent(code) {
    if (!code) return null;
    code = String(code).trim().toUpperCase();
    var fids = Object.keys(PREPARED_EVENTS.families);
    for (var i = 0; i < fids.length; i++) {
      var fam = PREPARED_EVENTS.families[fids[i]];
      for (var j = 0; j < fam.events.length; j++) {
        if (fam.events[j].code === code) {
          var ev = fam.events[j];
          return {
            code: ev.code,
            name: ev.name,
            cluster: ev.cluster,
            clusterDef: ev.clusterDef,
            familyId: fam.id,
            familyName: fam.name,
            submission: fam.submission,
            limit: fam.submission === "pitchDeck" ? fam.slideLimit : fam.pageLimit,
            limitNote: fam.submission === "pitchDeck" ? fam.slideLimitNote : fam.pageLimitNote,
            participants: fam.participants,
            presentationMinutes: fam.presentationMinutes,
            scoring: fam.scoring,
            role: fam.role,
            topic2627: fam.topic2627 || null,
            campaignLength: fam.campaignLength || null,
            exam: fam.exam || null,
            window: fam.window || null,
            originality: fam.originality || null,
            frontMatter: fam.frontMatter || null,
            slideNumbering: fam.slideNumbering || null,
            outline: fam.outline,
            writtenRubric: fam.writtenRubric,
            presentationRubric: fam.presentationRubric,
            penaltyChecklist:
              fam.submission === "pitchDeck" ? PENALTIES.pitchDeck : PENALTIES.writtenEntry
          };
        }
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------------
     PROMPT BUILDER
     Returns {system, user}. Feed straight into the Anthropic API call.
     --------------------------------------------------------------------- */

  var PREPARED_EVENT_SCHEMA = {
    eventCode: "string",
    overallScore: "number — sum of rubric awarded points",
    overallMax: "number",
    penaltyTotal: "number",
    finalScore: "number — overallScore minus penaltyTotal, floored at 0",
    headline: "string — 1-2 sentence verdict",
    rubric: [
      {
        section: "string",
        item: "number",
        criterion: "string",
        band: "novice | developing | proficient | exemplary",
        awarded: "number",
        max: "number",
        evidence: "string — quote or cite the part of the entry that earned this",
        toImprove: "string — the single highest-leverage fix for this line"
      }
    ],
    penalties: [
      {
        id: "string — e.g. WE2",
        rule: "string",
        status: "clear | violation | cannot-verify",
        pointsAssessed: "number",
        location: "string — page or slide number if known, else ''",
        explanation: "string"
      }
    ],
    missingSections: ["string — required outline sections not found"],
    strengths: ["string"],
    priorityFixes: ["string — ordered, highest point-swing first"],
    judgeQuestions: ["string — questions a judge is likely to ask, based on gaps in the entry"]
  };

  function bandsToText(bands) {
    return (
      "novice " + bands.novice[0] + "-" + bands.novice[1] +
      " | developing " + bands.developing[0] + "-" + bands.developing[1] +
      " | proficient " + bands.proficient[0] + "-" + bands.proficient[1] +
      " | exemplary " + bands.exemplary[0] + "-" + bands.exemplary[1]
    );
  }

  function rubricToText(ev) {
    var lines = [];
    if (ev.writtenRubric) {
      lines.push("WRITTEN ENTRY EVALUATION FORM (" + ev.writtenRubric.totalPoints + " points)");
      ev.writtenRubric.sections.forEach(function (sec) {
        lines.push("  [" + sec.section + "]");
        sec.items.forEach(function (it) {
          lines.push(
            "   " + it.n + ". " + it.criterion +
            "  (max " + it.max + "; " + bandsToText(it.bands) + ")"
          );
        });
      });
    } else {
      lines.push(
        "There is no separate written-entry form for this event. The pitch deck is scored through the Presentation Evaluation Form below — judge the deck's CONTENT against items 1-7 and its DESIGN against items 8-12."
      );
    }
    lines.push("");
    lines.push("PRESENTATION EVALUATION FORM (" + ev.presentationRubric.totalPoints + " points)");
    lines.push("  [Presentation Content]");
    ev.presentationRubric.content.forEach(function (it) {
      lines.push(
        "   " + it.n + ". " + it.name + " — " + it.criterion +
        "  (max " + it.max + "; " + bandsToText(it.bands) + ")"
      );
    });
    lines.push("  [Presentation Technique]");
    ev.presentationRubric.technique.forEach(function (it, i) {
      lines.push(
        "   " + (ev.presentationRubric.content.length + i + 1) + ". " + it.name + " — " + it.criterion +
        "  (max " + it.max + "; " + bandsToText(it.bands) + ")"
      );
    });
    return lines.join("\n");
  }

  function outlineToText(ev) {
    return ev.outline
      .map(function (s) {
        var t = s.num + ". " + s.title;
        if (s.detail) t += " — " + s.detail;
        if (s.sub) t += "\n     " + s.sub.join("\n     ");
        return t;
      })
      .join("\n");
  }

  function penaltiesToText(ev) {
    return ev.penaltyChecklist
      .map(function (p) {
        var pts = p.perUnit ? p.points + " " + p.perUnitLabel : p.points + " points";
        return (
          "[" + p.id + "] " + p.rule + "  → " + pts +
          (p.note ? "\n     Note: " + p.note : "")
        );
      })
      .join("\n");
  }

  var PREPARED_EVENT_SYSTEM =
    "You are a DECA prepared-event judge grading against the official DECA Guide 2026-27 evaluation forms. " +
    "You are strict, specific, and evidence-based: every score you assign must point to something actually present in (or missing from) the student's entry. " +
    "Never invent content that is not in the document. " +
    "When formatting details cannot be determined from extracted text (signatures, page size, aspect ratio, handwriting), mark the penalty item 'cannot-verify' rather than guessing. " +
    "Score honestly — inflated scores do not help a competitor. Award the exemplary band only when the work would genuinely stand out at a state or ICDC level. " +
    "Respond with a single JSON object and nothing else: no preamble, no markdown fences, no commentary.";

  function buildPreparedEventPrompt(code, documentText, meta) {
    var ev = getPreparedEvent(code);
    if (!ev) throw new Error("Unknown prepared event code: " + code);
    meta = meta || {};

    var unit = ev.submission === "pitchDeck" ? "slides" : "pages";
    var parts = [];

    parts.push("EVENT: " + ev.name + " (" + ev.code + ")");
    parts.push("EVENT FAMILY: " + ev.familyName);
    parts.push("CATEGORY DEFINITION: " + ev.clusterDef);
    parts.push("SUBMISSION TYPE: " + (ev.submission === "pitchDeck" ? "Pitch deck" : "Written entry"));
    parts.push("LIMIT: " + ev.limit + " " + unit + " — " + ev.limitNote);
    parts.push("PARTICIPANTS: " + ev.participants);
    parts.push("PRESENTATION: " + ev.presentationMinutes + " minutes maximum, including judge questions");
    parts.push("ROLE-PLAY FRAME: " + ev.role);
    parts.push("SCORING: " + ev.scoring);
    if (ev.topic2627) parts.push("REQUIRED 2026-2027 TOPIC: " + ev.topic2627);
    if (ev.campaignLength) parts.push("CAMPAIGN CONSTRAINT: " + ev.campaignLength);
    if (ev.window) parts.push("PROJECT WINDOW: " + ev.window);
    if (ev.originality) parts.push("ORIGINALITY RULE: " + ev.originality);
    if (ev.exam) parts.push("EXAM COMPONENT: " + ev.exam);

    parts.push("");
    parts.push("=== REQUIRED OUTLINE (must be followed; each section must be titled) ===");
    if (ev.frontMatter) parts.push("Front matter:\n - " + ev.frontMatter.join("\n - "));
    if (ev.slideNumbering) parts.push("Slide numbering:\n - " + ev.slideNumbering.join("\n - "));
    parts.push(outlineToText(ev));

    parts.push("");
    parts.push("=== PENALTY POINT CHECKLIST ===");
    parts.push(penaltiesToText(ev));

    parts.push("");
    parts.push("=== EVALUATION FORMS ===");
    parts.push(rubricToText(ev));

    parts.push("");
    parts.push("=== STUDENT SUBMISSION ===");
    if (meta.pageCount) parts.push("Reported " + unit + " count: " + meta.pageCount);
    if (meta.fileName) parts.push("File: " + meta.fileName);
    if (meta.notes) parts.push("Student notes: " + meta.notes);
    parts.push("---BEGIN ENTRY---");
    parts.push(documentText);
    parts.push("---END ENTRY---");

    parts.push("");
    parts.push("=== YOUR TASK ===");
    parts.push(
      "1. Score every line of every evaluation form above. For the presentation form, score only what the WRITTEN CONTENT supports (a student cannot be judged on live delivery here) — for delivery-only items, score the material's readiness to support that item and say so in the evidence field."
    );
    parts.push(
      "2. Walk the penalty checklist item by item. Mark each 'clear', 'violation', or 'cannot-verify'. For the " +
        unit +
        "-limit item, count actual " + unit + " and assess 5 points for each one over " + ev.limit + "."
    );
    parts.push("3. List any required outline section that is missing, untitled, renamed, or out of order.");
    parts.push("4. Give the student the highest-leverage fixes, ordered by how many points each would recover.");
    parts.push("5. Predict the questions a judge would ask based on the weakest or thinnest parts of the entry.");
    parts.push("");
    parts.push("Return ONLY a JSON object matching this schema:");
    parts.push(JSON.stringify(PREPARED_EVENT_SCHEMA, null, 2));

    return { system: PREPARED_EVENT_SYSTEM, user: parts.join("\n") };
  }

  /* ---------------------------------------------------------------------
     EXPORTS
     --------------------------------------------------------------------- */

  window.PREPARED_EVENTS = PREPARED_EVENTS;
  window.getPreparedEvent = getPreparedEvent;
  window.listPreparedEvents = listPreparedEvents;
  window.buildPreparedEventPrompt = buildPreparedEventPrompt;
  window.PREPARED_EVENT_SCHEMA = PREPARED_EVENT_SCHEMA;
})();
