/* =========================================================================
   FARM4GLASS — QUESTION BANK 3
   Marketing Cluster Exam · Pricing, Product/Service Management, Professional
   Development, Promotion, Selling, Strategic Management. 60 questions.

   index.html already loads this file, so no HTML change is needed. Sign in as
   admin, open the console, and run:

       f4gImportQuestions()                 // preview — writes nothing
       f4gImportQuestions({ apply: true })  // writes to Firestore

   Check the Unit column in the preview table first. Any row that says
   "NEW UNIT created" means the area name didn't exactly match one of your
   existing marketing units — either rename that unit in Admin > Courses, or
   add its exact title to that entry's aliases array below.
   ========================================================================= */

(function () {
  const BANK = [

    /* ===================== PRICING ===================== */
    {
      ia: "Pricing",
      aliases: ["Pricing Strategies", "Price"],
      questions: [
        {
          q: "A sneaker company launches a highly innovative shoe. It charges $300 at launch and plans to reduce the price as the product becomes established. Which strategy is being used?",
          options: ["One-price policy", "Price skimming", "Cost-plus pricing", "Captive product pricing"],
          answer: 1,
          explanation: "Price skimming starts with a high initial price and gradually lowers it over time."
        },
        {
          q: "A retailer sells every item in its store for exactly $5. Which pricing approach does this illustrate?",
          options: ["One-price policy", "Price discrimination", "Price fixing", "Deceptive pricing"],
          answer: 0,
          explanation: "A one-price policy uses a single price for the goods being sold, simplifying the buying process."
        },
        {
          q: "Two competing businesses secretly agree that both will charge $40 for the same service. This is an example of:",
          options: ["Price skimming", "Cost-plus pricing", "Price fixing", "Price lining"],
          answer: 2,
          explanation: "Price fixing occurs when competitors agree on prices. It is an illegal practice."
        },
        {
          q: "A printer is inexpensive, but the company earns significant revenue from proprietary ink cartridges that must be used with it. What strategy is this?",
          options: ["Captive product pricing", "Loss-leader pricing", "Price skimming", "One-price policy"],
          answer: 0,
          explanation: "Captive product pricing involves pricing products that must be used with a main product, such as printers and ink."
        },
        {
          q: "A store advertises a jacket as 'originally $200, now $80,' even though it never actually sold the jacket for $200. This is:",
          options: ["Cost-plus pricing", "Deceptive pricing", "Price skimming", "One-price pricing"],
          answer: 1,
          explanation: "Deceptive pricing misrepresents the original price to make the discount appear better than it really is."
        },
        {
          q: "A business determines that a product costs $40 per unit and adds a fixed 25% markup. What pricing method is being used?",
          options: ["Cost-plus pricing", "Predatory pricing", "Price discrimination", "Price fixing"],
          answer: 0,
          explanation: "Cost-plus pricing determines the selling price by adding a specific markup to unit cost."
        },
        {
          q: "Demand for concert tickets rises sharply while supply remains unchanged. What would generally happen to price?",
          options: ["Price decreases", "Price stays fixed", "Price increases", "Price becomes zero"],
          answer: 2,
          explanation: "Holding supply constant, higher demand generally leads to a higher price."
        },
        {
          q: "A government establishes the highest legal price that can be charged for a basic service. This is a:",
          options: ["Price floor", "Price ceiling", "Markup", "Cost-plus rule"],
          answer: 1,
          explanation: "A price ceiling is a maximum price that may be charged."
        },
        {
          q: "A company intentionally sets prices extremely low to eliminate competing businesses from the market. Which concept best fits?",
          options: ["Predatory pricing", "Price skimming", "One-price policy", "Captive pricing"],
          answer: 0,
          explanation: "Predatory pricing involves setting prices low in an attempt to eliminate competition."
        },
        {
          q: "A luxury brand increases its markup because its customers strongly associate the brand with exclusivity and premium quality. Which factor is most directly supporting the markup?",
          options: ["Brand positioning", "Price ceiling", "Buyer surplus", "Seasonal ordering"],
          answer: 0,
          explanation: "Premium brands can use higher markups to reinforce status and perceived value."
        }
      ]
    },

    /* ============ PRODUCT/SERVICE MANAGEMENT ============ */
    {
      ia: "Product/Service Management",
      aliases: ["Product Service Management", "Product and Service Management", "Product Management"],
      questions: [
        {
          q: "A company notices that sales are rising rapidly and competitors are entering its market. Which product-life-cycle stage is most likely?",
          options: ["Introduction", "Growth", "Maturity", "Decline"],
          answer: 1,
          explanation: "The growth stage is characterized by growing sales and increasing profit."
        },
        {
          q: "A new product is launched with heavy promotional activity designed to create awareness and excitement. Which life-cycle stage is this?",
          options: ["Introduction", "Growth", "Maturity", "Decline"],
          answer: 0,
          explanation: "The introduction stage begins when the product is commercialized and typically involves high promotional effort."
        },
        {
          q: "A company reduces promotional spending and focuses on maintaining a product that has reached peak market performance. Which stage is this?",
          options: ["Introduction", "Growth", "Maturity", "Decline"],
          answer: 2,
          explanation: "During maturity, the product has reached peak performance and the business focuses on maintaining sales."
        },
        {
          q: "A business removes a consistently unprofitable product from its catalog. Which product/service-management activity is this?",
          options: ["Identifying new opportunities", "Monitoring existing products", "Eliminating weak products", "Market penetration"],
          answer: 2,
          explanation: "Eliminating weak products is a core product/service-management responsibility."
        },
        {
          q: "A seller tells a customer, 'This laptop has 16 GB of RAM.' What is this statement describing?",
          options: ["A benefit", "A feature", "A value proposition", "A brand promise"],
          answer: 1,
          explanation: "A feature is a physical or functional characteristic that describes a product."
        },
        {
          q: "A salesperson explains that the laptop's 16 GB of RAM will allow the customer to run multiple programs smoothly. This is a:",
          options: ["Feature", "Benefit", "Trademark", "Warranty"],
          answer: 1,
          explanation: "A benefit is the advantage the customer receives from a product feature."
        },
        {
          q: "A retailer sells products under a brand name owned by the retailer rather than the manufacturer. What type of brand is this?",
          options: ["Manufacturer/national brand", "Family brand", "Private/store brand", "Individual brand"],
          answer: 2,
          explanation: "A private/store brand is owned by an intermediary or retailer."
        },
        {
          q: "A company promises to repair or replace a defective product under specific written conditions. What is this promise called?",
          options: ["Warranty", "Brand preference", "Grade", "Product mix"],
          answer: 0,
          explanation: "A warranty is a seller's promise to repair or replace a product that does not perform as expected."
        },
        {
          q: "A consumer refuses competing products and searches exclusively for one preferred brand. This is:",
          options: ["Brand recognition", "Brand preference", "Brand insistence", "Brand awareness"],
          answer: 2,
          explanation: "Brand insistence occurs when a consumer refuses alternatives and seeks the desired brand exclusively."
        },
        {
          q: "A company emphasizes a unique feature that competitors do not offer, helping it stand out in the market. This is best described as:",
          options: ["Competitive advantage", "Routine buying", "Price fixing", "Horizontal conflict"],
          answer: 0,
          explanation: "A competitive advantage is a unique strength that makes a product stand out from competitors."
        }
      ]
    },

    /* ============== PROFESSIONAL DEVELOPMENT ============== */
    {
      ia: "Professional Development",
      aliases: ["Career Development", "Professional Development Skills"],
      questions: [
        {
          q: "A student sets the goal: 'I will score at least 85% on my next three marketing practice tests by October 1.' Which SMART characteristic is most clearly demonstrated by the score requirement?",
          options: ["Specific", "Measurable", "Relevant", "Attainable"],
          answer: 1,
          explanation: "The goal is measurable because it includes a quantifiable result: at least 85%."
        },
        {
          q: "Which goal is most clearly time-bound?",
          options: ["Improve my communication skills", "Become a better salesperson", "Complete three presentations by December 15", "Learn more about marketing"],
          answer: 2,
          explanation: "A time-bound goal includes a defined deadline."
        },
        {
          q: "A manager creates a plan for how employees should perform routine daily activities. This is primarily an:",
          options: ["Ideological goal", "Operational goal", "Product goal", "Strategic goal"],
          answer: 1,
          explanation: "Operational goals address how an organization will operate on a daily basis and relate to productivity."
        },
        {
          q: "A company sets a goal to improve product quality and customer satisfaction. This is a:",
          options: ["Product goal", "Ideological goal", "Operational goal", "Tactical goal"],
          answer: 0,
          explanation: "Product goals focus on product quality and increasing customer satisfaction."
        },
        {
          q: "A business creates a long-term objective covering the next three years. This is a:",
          options: ["Tactical goal", "Strategic goal", "Daily goal", "Operational task"],
          answer: 1,
          explanation: "Strategic goals are long-term goals of more than one year."
        },
        {
          q: "Which resume practice is recommended?",
          options: ["Use the exact same resume for every job", "Make every resume three pages", "Create different resumes for each job", "Remove skills from the resume"],
          answer: 2,
          explanation: "Resumes should be tailored for different jobs."
        },
        {
          q: "After an interview, which action is the best follow-up?",
          options: ["Avoid contacting the employer", "Send a thank-you message that reaffirms your skills", "Immediately demand a decision", "Submit a second identical resume"],
          answer: 1,
          explanation: "Follow up with a thank-you that reaffirms your skills and how you can help the company."
        },
        {
          q: "An employee has several tasks and decides which ones should receive attention first. Which principle is designed to prioritize goals?",
          options: ["ABC principle", "CMMI", "PEST", "Push policy"],
          answer: 0,
          explanation: "The ABC principle is a strategy for prioritizing goals."
        },
        {
          q: "Which SMART characteristic asks whether a goal is realistic?",
          options: ["Specific", "Measurable", "Attainable", "Time-bound"],
          answer: 2,
          explanation: "Attainable means the goal must be realistic and achievable."
        },
        {
          q: "A student says, 'I will improve my presentation skills by practicing two presentations each week because strong presentations will help me succeed in my marketing career.' Which SMART characteristic is best represented by the reason connecting the goal to the student's career?",
          options: ["Relevant", "Measurable", "Specific", "Time-bound"],
          answer: 0,
          explanation: "A relevant goal is applicable to the individual or business and connects to meaningful objectives."
        }
      ]
    },

    /* ===================== PROMOTION ===================== */
    {
      ia: "Promotion",
      aliases: ["Promotions", "Promotion Strategies"],
      questions: [
        {
          q: "A company publishes a campaign highlighting its environmental responsibility to create a favorable image of the business. What type of promotion is this?",
          options: ["Institutional promotion", "Sales promotion", "Direct marketing", "Push policy"],
          answer: 0,
          explanation: "Institutional promotion focuses on creating a favorable image for a business."
        },
        {
          q: "A salesperson meets one-on-one with a customer and recommends a solution based on the customer's needs. This is:",
          options: ["Advertising", "Personal selling", "Primary promotion", "Sweepstakes"],
          answer: 1,
          explanation: "Personal selling involves direct interaction between a salesperson and customer and allows tailored solutions."
        },
        {
          q: "A company pays for a television campaign to build awareness of a new product. Which promotional method is this?",
          options: ["Advertising", "Organic marketing", "Grassroots marketing", "Personal selling"],
          answer: 0,
          explanation: "Advertising is paid promotion through media such as television, radio, and the internet."
        },
        {
          q: "A company emails previous customers a personalized coupon. This is best classified as:",
          options: ["Direct marketing", "Institutional promotion", "Primary promotion", "Shill marketing"],
          answer: 0,
          explanation: "Direct marketing communicates directly with specific consumers and can use personalized messages."
        },
        {
          q: "A retailer offers 'Buy One, Get One Free' for one weekend. What type of promotion is this?",
          options: ["Sales promotion", "Public relations", "Primary promotion", "Institutional promotion"],
          answer: 0,
          explanation: "Sales promotion uses short-term incentives to encourage purchases."
        },
        {
          q: "A dairy-industry campaign promotes the health benefits of milk without focusing on one particular dairy brand. This is:",
          options: ["Secondary promotion", "Primary promotion", "Direct marketing", "Personal selling"],
          answer: 1,
          explanation: "Primary promotion generates demand for an entire class or category of goods."
        },
        {
          q: "A manufacturer provides promotional support to retailers to encourage them to carry and promote its product. Which policy is this?",
          options: ["Pull", "Push", "Organic", "Grassroots"],
          answer: 1,
          explanation: "A push policy is aimed at intermediaries in the distribution channel."
        },
        {
          q: "A brand creates social media content and gains followers naturally without directly paying for advertising. This is:",
          options: ["Organic marketing", "Shill marketing", "Price promotion", "Institutional advertising"],
          answer: 0,
          explanation: "Organic marketing promotes a product without direct paid involvement and can build authentic relationships."
        },
        {
          q: "Employees secretly post fake positive reviews while pretending to be ordinary customers. What is this?",
          options: ["Buzz marketing", "Shill marketing", "Grassroots marketing", "Primary promotion"],
          answer: 1,
          explanation: "Shill marketing is deceptive promotion in which employees pose as customers. It is highly unethical."
        },
        {
          q: "Which advertisement element is the memorable phrase that reinforces a brand or product identity?",
          options: ["Copy", "Headline", "White space", "Tag line"],
          answer: 3,
          explanation: "A tag line is a memorable phrase used to convey the essence of a brand or product."
        }
      ]
    },

    /* ====================== SELLING ====================== */
    {
      ia: "Selling",
      aliases: ["Sales", "Selling Function"],
      questions: [
        {
          q: "A salesperson first asks questions to understand what problem the customer is trying to solve. Which part of the selling process is being emphasized?",
          options: ["Reaching closure", "Determining customer needs", "Reaffirming the relationship", "Handling payment"],
          answer: 1,
          explanation: "Determining customer needs means understanding the customer's problem before prescribing a solution."
        },
        {
          q: "A salesperson demonstrates a product and explains how it solves the customer's specific problem. What step is this most closely associated with?",
          options: ["Prescribing solutions to customer needs", "Prospecting only", "Reaffirming the relationship", "Price fixing"],
          answer: 0,
          explanation: "Prescribing solutions means finding a solution for the customer's problem through conversation and demonstration."
        },
        {
          q: "A customer says, 'I'm worried this product is too expensive.' The salesperson explains the value and addresses the concern before asking for the purchase. This is part of:",
          options: ["Reaching closure", "Product development", "Prospecting", "Market segmentation"],
          answer: 0,
          explanation: "Reaching closure includes handling objections and clearing them up so the sale can be completed."
        },
        {
          q: "After a purchase, a salesperson checks in and reassures the buyer that the product is a good choice. This demonstrates:",
          options: ["Reaffirming buyer-seller relationships", "Price skimming", "Primary promotion", "Product grading"],
          answer: 0,
          explanation: "Reaffirming the buyer-seller relationship involves reassuring the customer and answering questions."
        },
        {
          q: "A salesperson says, 'This phone has a 5,000 mAh battery.' This is a:",
          options: ["Benefit", "Feature", "Value proposition", "Closing technique"],
          answer: 1,
          explanation: "A feature is a physical or functional characteristic of a product."
        },
        {
          q: "A salesperson explains, 'Because the battery is 5,000 mAh, you can go longer between charges.' This is a:",
          options: ["Feature", "Benefit", "Warranty", "Brand"],
          answer: 1,
          explanation: "A benefit explains the advantage the customer wants or receives from a feature."
        },
        {
          q: "A customer needs a product that is exclusive to a particular service and cannot be obtained from competitors. Which type of benefit might the salesperson emphasize?",
          options: ["Exclusive benefit", "Obvious benefit", "Hidden cost", "Routine benefit"],
          answer: 0,
          explanation: "Exclusive benefits are advantages available only from that service."
        },
        {
          q: "A customer does not understand why a technical feature matters until the salesperson explains it. What type of benefit is this?",
          options: ["Obvious benefit", "Exclusive benefit", "Hidden benefit", "Financial benefit"],
          answer: 2,
          explanation: "A hidden benefit is one that can only be understood with the help of a salesperson."
        },
        {
          q: "A salesperson has a list of potential buyers and begins identifying which people may have a genuine need for the product. What selling activity is being performed?",
          options: ["Prospecting", "Closing", "Reaffirming", "Merchandising"],
          answer: 0,
          explanation: "Prospecting is the process of identifying potential customers before moving further into the sale."
        },
        {
          q: "A salesperson asks questions, listens carefully, and then recommends the best product rather than immediately giving a generic sales pitch. Why is this effective?",
          options: ["It connects the solution to customer needs", "It eliminates all competition", "It guarantees the lowest price", "It avoids communication"],
          answer: 0,
          explanation: "Understanding customer needs first lets the salesperson prescribe a solution to the customer's actual problem."
        }
      ]
    },

    /* =============== STRATEGIC MANAGEMENT =============== */
    {
      ia: "Strategic Management",
      aliases: ["Strategic Management and Planning"],
      questions: [
        {
          q: "A company identifies risks that could prevent it from achieving its objectives, assesses those risks, and develops ways to reduce them. This is:",
          options: ["Enterprise risk management", "Price fixing", "Personal selling", "Product grading"],
          answer: 0,
          explanation: "Enterprise risk management identifies, assesses, and prioritizes risks and develops strategies to mitigate or eliminate them."
        },
        {
          q: "A manager establishes goals and develops action plans to achieve them. Which management function is this?",
          options: ["Organizing", "Planning", "Controlling", "Directing"],
          answer: 1,
          explanation: "Planning involves setting goals and developing strategies and action plans to achieve them."
        },
        {
          q: "A manager assigns people, equipment, and financial resources to different teams and establishes responsibilities. Which function is being performed?",
          options: ["Planning", "Organizing", "Controlling", "Selling"],
          answer: 1,
          explanation: "Organizing coordinates resources and establishes structures, roles, and responsibilities."
        },
        {
          q: "A manager compares actual performance with standards and makes adjustments when results are off track. Which function is this?",
          options: ["Directing", "Planning", "Controlling", "Prospecting"],
          answer: 2,
          explanation: "Controlling involves monitoring performance, comparing it with standards, and making necessary adjustments."
        },
        {
          q: "A manager motivates employees, communicates the plan, and encourages them to take ownership of their responsibilities. This is:",
          options: ["Directing", "Controlling", "Organizing", "Forecasting"],
          answer: 0,
          explanation: "Directing involves leading and motivating employees and communicating the plan."
        },
        {
          q: "Which manager is most likely responsible for the day-to-day activities of employees?",
          options: ["Executive manager", "Regional manager", "First-line manager", "Board chair"],
          answer: 2,
          explanation: "First-line managers manage day-to-day activities and first-line employees."
        },
        {
          q: "A company uses performance results to change future inputs and decisions. Which type of control does this illustrate?",
          options: ["Feedback control", "Feedforward control", "Price control", "Inventory control"],
          answer: 0,
          explanation: "Feedback control changes inputs based on the performance of outputs and is a cyclical process."
        },
        {
          q: "A company tries to predict likely results before an action occurs and adjusts inputs based on those predictions. This is:",
          options: ["Feedback control", "Feedforward control", "Product control", "Financial accounting"],
          answer: 1,
          explanation: "Feedforward control uses predicted outputs to adjust inputs before results occur."
        },
        {
          q: "A software company evaluates its process maturity using CMMI. Which level comes immediately before 'Optimizing'?",
          options: ["Initial", "Managed", "Defined", "Quantitatively Managed"],
          answer: 3,
          explanation: "The CMMI levels are Initial, Managed, Defined, Quantitatively Managed, and Optimizing."
        },
        {
          q: "A company wants to improve its processes continuously and systematically. Which model is a process-improvement model developed by Carnegie Mellon University?",
          options: ["CMMI", "SWOT", "SMART", "ABC"],
          answer: 0,
          explanation: "Capability Maturity Model Integration (CMMI) is a process improvement model designed by Carnegie Mellon University."
        }
      ]
    }

  ];

  // Files 1 and 2 load first, so append rather than replace.
  window.F4G_QUESTION_BANK = (window.F4G_QUESTION_BANK || []).concat(BANK);
})();
