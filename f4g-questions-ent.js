/* =========================================================================
   FARM4GLASS — QUESTION BANK: ENTREPRENEURSHIP CLUSTER
   220 questions across 22 instructional areas, 10 per area.

   WHY THIS FILE IS DIFFERENT FROM f4g-questions-1/2/3.js
   Those three all write into window.F4G_QUESTION_BANK, and the importer sends
   whatever is in that variable to ONE course. If this file did the same, then
   importing into entrepreneurship would also dump every marketing question in
   there. So this bank lives in its own variable and you point the importer at
   it deliberately.

   HOW TO USE
   1. Save this file next to index.html.
   2. Add this line to index.html just before </body>, BEFORE the
      f4g-import-questions.js module line:

        <script src="f4g-questions-ent.js"></script>

   3. Load the site, sign in as admin, open the console, and run these two
      lines together:

        window.F4G_QUESTION_BANK = window.F4G_QUESTION_BANK_ENT;
        f4gImportQuestions({ courseId: "entrepreneurship-cluster" })

      That's the PREVIEW — nothing is written. Check the Unit column.

   4. When it looks right:

        f4gImportQuestions({ courseId: "entrepreneurship-cluster", apply: true })

   5. Reload the page. F4G_QUESTION_BANK goes back to the marketing bank on
      its own, since the swap in step 3 only lives until you refresh.

   NOTE ON courseId: "entrepreneurship-cluster" is the ID for the
   Entrepreneurship cluster exam course. If the importer says there's no such
   course document, check the ID in Admin > Courses and pass that instead.

   NOTE ON OPTION ORDER: the source answer key ran A, D, C, B repeating in
   every single unit. The shuffle helper at the bottom scrambles each
   question's options deterministically and moves the answer index with them,
   so the position pattern is gone. Same output every run.
   ========================================================================= */

(function () {
  function Q(q, options, answer, explanation) {
    return { q, options, answer, explanation };
  }

  const BANK = [

    /* ================= UNIT 1: BUSINESS LAW ================= */
    {
      ia: "Business Law",
      aliases: ["Business Law and Ethics", "Law"],
      questions: [
        Q("A small business is owned and managed by one person, who keeps the profits but also assumes the business risk. Which concept best describes this?",
          ["Sole proprietorship", "General partnership", "Limited partnership", "Corporation"], 0,
          "A sole proprietorship has one owner who keeps the profits and personally carries the risk."),
        Q("Two owners operate a business together and share responsibility for its debts. What term describes this?",
          ["Litigation", "Arbitration", "Mediation", "General partnership"], 3,
          "In a general partnership, the owners share both the operation of the business and responsibility for its debts."),
        Q("One partner's potential loss is limited to the amount invested in the business. Which concept is this?",
          ["OSHA", "SEC", "Limited partnership", "FTC"], 2,
          "A limited partner's exposure stops at the amount they invested."),
        Q("A business is legally separate from its owners and can raise capital by selling stock. Which structure is this?",
          ["Limited partnership", "Corporation", "Sole proprietorship", "General partnership"], 1,
          "A corporation is a separate legal entity from its owners and can issue stock to raise capital."),
        Q("A business dispute is resolved through a formal court process. Which term identifies this?",
          ["Litigation", "Corporation", "Arbitration", "Mediation"], 0,
          "Litigation is dispute resolution through the courts."),
        Q("A third-party arbitrator hears both sides and rules in favor of one side. What is the correct term?",
          ["FTC", "OSHA", "SEC", "Arbitration"], 3,
          "In arbitration, a neutral third party hears the dispute and issues a decision for one side."),
        Q("A neutral third party helps disputing parties reach a mutually agreed solution rather than ruling for one side. Which concept is this?",
          ["General partnership", "Limited partnership", "Mediation", "Sole proprietorship"], 2,
          "A mediator guides the parties toward their own agreement instead of deciding the outcome."),
        Q("A company is investigated for practices that may harm consumers or create unfair competition. Which agency is involved?",
          ["Arbitration", "FTC", "Corporation", "Litigation"], 1,
          "The FTC addresses practices that harm consumers or create unfair competition."),
        Q("A business is required to maintain safe working conditions for employees. Which agency sets this requirement?",
          ["OSHA", "Mediation", "FTC", "SEC"], 0,
          "OSHA governs workplace health and safety standards."),
        Q("A company is investigated for possible insider trading involving its stock. Which agency is involved?",
          ["Sole proprietorship", "General partnership", "Limited partnership", "SEC"], 3,
          "The SEC regulates securities markets, including insider trading.")
      ]
    },

    /* ============= UNIT 2: CHANNEL MANAGEMENT ============= */
    {
      ia: "Channel Management",
      aliases: ["Distribution", "Channels of Distribution"],
      questions: [
        Q("A retailer reviews how efficiently products move from manufacturers to customers. Which concept is this?",
          ["Channel management", "Intermediary", "Vertical conflict", "Horizontal conflict"], 0,
          "Channel management covers how products move through the distribution channel to the customer."),
        Q("A wholesaler helps move products between a manufacturer and the final consumer. What term applies?",
          ["WMS", "ERP", "Gray market", "Intermediary"], 3,
          "An intermediary sits between the producer and the final consumer in the channel."),
        Q("A manufacturer and wholesaler disagree about distribution responsibilities. Which concept is this?",
          ["Selective distribution", "Exclusive distribution", "Vertical conflict", "Intensive distribution"], 2,
          "Vertical conflict occurs between members at different levels of the same channel."),
        Q("Two retailers at the same level of a distribution channel compete over the same territory. Which concept is this?",
          ["Vertical conflict", "Horizontal conflict", "Channel management", "Intermediary"], 1,
          "Horizontal conflict occurs between channel members at the same level."),
        Q("A warehouse tracks products as they are picked, packed, shipped, and received. Which system is this?",
          ["WMS", "Horizontal conflict", "ERP", "Gray market"], 0,
          "A warehouse management system tracks goods through picking, packing, shipping, and receiving."),
        Q("A company uses software that integrates inventory, accounting, and customer relationship processes. What is this?",
          ["Intensive distribution", "Selective distribution", "Exclusive distribution", "ERP"], 3,
          "Enterprise resource planning software integrates business processes into one system."),
        Q("A product is legally resold through a channel that was not part of the manufacturer's intended authorized distribution system. Which concept is this?",
          ["Intermediary", "Vertical conflict", "Gray market", "Channel management"], 2,
          "Gray market goods are sold legally, but outside the manufacturer's authorized channel."),
        Q("A company tries to place a product in as many outlets as possible. Which term applies?",
          ["ERP", "Intensive distribution", "Horizontal conflict", "WMS"], 1,
          "Intensive distribution maximizes the number of outlets carrying the product."),
        Q("A company sells a product through selected outlets in particular locations. What is the best answer?",
          ["Selective distribution", "Gray market", "Intensive distribution", "Exclusive distribution"], 0,
          "Selective distribution uses a limited set of chosen outlets."),
        Q("A premium product is sold through only one or very few outlets. Which concept is this?",
          ["Channel management", "Intermediary", "Vertical conflict", "Exclusive distribution"], 3,
          "Exclusive distribution restricts the product to one or very few outlets, which supports a premium image.")
      ]
    },

    /* ================ UNIT 3: COMMUNICATION ================ */
    {
      ia: "Communication",
      aliases: ["Communication Skills", "Communications"],
      questions: [
        Q("A manager sends a message to an employee and the employee receives it. Which concept is this?",
          ["Communication", "Media/channel", "Feedback", "Distraction"], 0,
          "Communication is the exchange of a message between a sender and a receiver."),
        Q("A company chooses email, phone, television, or another method to deliver a message. What term applies?",
          ["Emotional barrier", "Setting", "Active listening", "Media/channel"], 3,
          "The media or channel is the method used to carry the message."),
        Q("A customer responds to a message and clarifies whether it was understood. Which concept is this?",
          ["Mass communication channel", "Clarification", "Feedback", "Personal communication channel"], 2,
          "Feedback is the receiver's response that tells the sender whether the message landed."),
        Q("Noise and interruptions prevent an employee from paying attention during a meeting. Which concept is this?",
          ["Feedback", "Distraction", "Communication", "Media/channel"], 1,
          "A distraction is anything that pulls attention away from the message."),
        Q("A listener rejects an idea because of a strong personal bias against the speaker. Which term applies?",
          ["Emotional barrier", "Distraction", "Setting", "Active listening"], 0,
          "An emotional barrier is a feeling or bias that blocks the message from getting through."),
        Q("A manager considers the environment in which an important conversation will occur. What is the correct term?",
          ["Personal communication channel", "Mass communication channel", "Clarification", "Setting"], 3,
          "The setting is the environment in which communication takes place."),
        Q("An employee focuses on the main subject, pays attention, and demonstrates engagement. Which concept is this?",
          ["Media/channel", "Feedback", "Active listening", "Communication"], 2,
          "Active listening means concentrating on the message and visibly engaging with it."),
        Q("A salesperson uses a phone call or face-to-face conversation to communicate with one customer. Which term applies?",
          ["Setting", "Personal communication channel", "Distraction", "Emotional barrier"], 1,
          "A personal communication channel reaches one person directly."),
        Q("A business uses television, radio, or the internet to reach a large audience. What is the best answer?",
          ["Mass communication channel", "Active listening", "Personal communication channel", "Clarification"], 0,
          "A mass communication channel delivers one message to many people at once."),
        Q("A receiver asks follow-up questions so the sender can explain an unclear message. Which concept is this?",
          ["Communication", "Media/channel", "Feedback", "Clarification"], 3,
          "Clarification is asking for more detail so an unclear message can be understood.")
      ]
    },

    /* =============== UNIT 4: CUSTOMER RELATIONS =============== */
    {
      ia: "Customer Relations",
      aliases: ["Customer Relationship Management", "Customer Service"],
      questions: [
        Q("A business evaluates how it interacts with customers before, during, and after purchases. Which concept is this?",
          ["Customer relations", "Brand promise", "Customer touchpoint", "Audience focus"], 0,
          "Customer relations covers the full set of interactions a business has with its customers."),
        Q("A company communicates the experience and value customers can consistently expect. What term applies?",
          ["Customer needs", "Customer satisfaction", "Brand insistence", "Brand promise"], 3,
          "A brand promise states what customers can reliably expect from the brand."),
        Q("A customer interacts with a company through an advertisement, website, purchase, or service interaction. Which concept is this?",
          ["Consistent brand promise", "Customer experience", "Customer touchpoint", "Active listening"], 2,
          "Each point of contact between customer and business is a touchpoint."),
        Q("A business develops a brand promise by first considering who it wants to serve. Which concept is this?",
          ["Customer touchpoint", "Audience focus", "Customer relations", "Brand promise"], 1,
          "Audience focus means defining who the business is serving before shaping the promise."),
        Q("A company actively listens and responds to what customers want or require. Which term applies?",
          ["Customer needs", "Audience focus", "Customer satisfaction", "Brand insistence"], 0,
          "Customer needs are what the customer wants or requires from the business."),
        Q("A company consistently delivers its promised experience and customers become more satisfied. What is the correct term?",
          ["Active listening", "Consistent brand promise", "Customer experience", "Customer satisfaction"], 3,
          "Customer satisfaction is the result of the business meeting or exceeding what it promised."),
        Q("A customer refuses alternatives and searches specifically for a preferred brand. Which concept is this?",
          ["Brand promise", "Customer touchpoint", "Brand insistence", "Customer relations"], 2,
          "Brand insistence is the strongest level of brand loyalty: no substitute will do."),
        Q("A service employee pays attention to a customer's concern, shows respect, and responds to the need. Which term applies?",
          ["Customer satisfaction", "Active listening", "Audience focus", "Customer needs"], 1,
          "Active listening in service means fully attending to the concern before responding."),
        Q("A business aligns its advertisements, purchases, and service interactions with the same promised experience. What is the best answer?",
          ["Consistent brand promise", "Brand insistence", "Active listening", "Customer experience"], 0,
          "A consistent brand promise means every touchpoint delivers the same thing."),
        Q("A company evaluates the total impression a customer receives across interactions with the business. Which concept is this?",
          ["Customer relations", "Brand promise", "Customer touchpoint", "Customer experience"], 3,
          "Customer experience is the overall impression formed across all interactions.")
      ]
    },

    /* ================== UNIT 5: ECONOMICS ================== */
    {
      ia: "Economics",
      aliases: ["Economic Systems"],
      questions: [
        Q("A manufacturer uses land, lumber, water, and minerals as inputs. Which concept is this?",
          ["Natural resources", "Human resources", "Capital goods", "Consumer goods"], 0,
          "Natural resources are raw inputs that come from the earth."),
        Q("Employees provide the labor needed to produce and sell goods. What term applies?",
          ["Market economy", "Communist command economy", "GDP", "Human resources"], 3,
          "Human resources are the people whose labor produces goods and services."),
        Q("A factory uses machinery and conveyor belts to produce consumer products. Which concept is this?",
          ["Inflation", "Recession", "Capital goods", "Seller's market"], 2,
          "Capital goods are the equipment used to produce other goods."),
        Q("A customer purchases a bicycle for personal use. Which concept is this?",
          ["Capital goods", "Consumer goods", "Natural resources", "Human resources"], 1,
          "Consumer goods are bought by individuals for personal use."),
        Q("Private businesses compete for customers while prices respond to supply and demand. Which term applies?",
          ["Market economy", "Consumer goods", "Communist command economy", "GDP"], 0,
          "In a market economy, private competition and supply and demand set prices."),
        Q("The government controls production, distribution, and economic planning. What is the correct term?",
          ["Seller's market", "Inflation", "Recession", "Communist command economy"], 3,
          "In a command economy the government makes the production and distribution decisions."),
        Q("An analyst measures the value of goods and services produced within a country during a year. Which concept is this?",
          ["Human resources", "Capital goods", "GDP", "Natural resources"], 2,
          "Gross domestic product measures a country's total output over a period."),
        Q("Supply is limited while demand is high, allowing sellers to raise prices. Which term applies?",
          ["Communist command economy", "Seller's market", "Consumer goods", "Market economy"], 1,
          "A seller's market gives sellers pricing power because demand outruns supply."),
        Q("Prices throughout an economy rise, increasing the cost of goods and services. What is the best answer?",
          ["Inflation", "GDP", "Seller's market", "Recession"], 0,
          "Inflation is a general rise in prices across the economy."),
        Q("Economic activity slows, consumers spend less, production falls, and unemployment rises. Which concept is this?",
          ["Natural resources", "Human resources", "Capital goods", "Recession"], 3,
          "A recession is a sustained slowdown in economic activity.")
      ]
    },

    /* ============ UNIT 6: EMOTIONAL INTELLIGENCE ============ */
    {
      ia: "Emotional Intelligence",
      aliases: ["EI"],
      questions: [
        Q("An employee manages personal emotions effectively and uses interpersonal skills to work with others. Which concept is this?",
          ["Emotional intelligence", "Self-management", "Self-awareness", "Social awareness"], 0,
          "Emotional intelligence is managing your own emotions and working effectively with others."),
        Q("An employee notices frustration and controls how that emotion is expressed at work. What term applies?",
          ["Relationship management", "Empathy", "Extrinsic motivation", "Self-management"], 3,
          "Self-management is regulating how your emotions come out in behavior."),
        Q("An employee recognizes how personal emotions affect thoughts and actions. Which concept is this?",
          ["Primary dimension of diversity", "Secondary dimension of diversity", "Self-awareness", "Intrinsic motivation"], 2,
          "Self-awareness is recognizing your own emotions and their effect on you."),
        Q("A manager recognizes how coworkers are feeling and responds appropriately. Which concept is this?",
          ["Self-awareness", "Social awareness", "Emotional intelligence", "Self-management"], 1,
          "Social awareness is reading and responding to the emotions of others."),
        Q("A team member communicates, collaborates, and maintains trust with coworkers. Which term applies?",
          ["Relationship management", "Social awareness", "Empathy", "Extrinsic motivation"], 0,
          "Relationship management is building and sustaining working relationships."),
        Q("An employee tries to understand another person's feelings before responding. What is the correct term?",
          ["Intrinsic motivation", "Primary dimension of diversity", "Secondary dimension of diversity", "Empathy"], 3,
          "Empathy is understanding what another person is feeling."),
        Q("An employee works harder because of an external reward. Which concept is this?",
          ["Self-management", "Self-awareness", "Extrinsic motivation", "Emotional intelligence"], 2,
          "Extrinsic motivation comes from outside rewards such as pay or recognition."),
        Q("An employee is motivated by internal satisfaction from doing meaningful work. Which term applies?",
          ["Empathy", "Intrinsic motivation", "Social awareness", "Relationship management"], 1,
          "Intrinsic motivation comes from the satisfaction of the work itself."),
        Q("Age or ethnicity is an example of a characteristic classified as which type of diversity dimension?",
          ["Primary dimension of diversity", "Extrinsic motivation", "Intrinsic motivation", "Secondary dimension of diversity"], 0,
          "Primary dimensions are inborn characteristics that generally can't be changed."),
        Q("Education, work experience, or income is an example of which type of diversity dimension?",
          ["Emotional intelligence", "Self-management", "Self-awareness", "Secondary dimension of diversity"], 3,
          "Secondary dimensions are acquired characteristics that can change over a lifetime.")
      ]
    },

    /* =============== UNIT 7: ENTREPRENEURSHIP =============== */
    {
      ia: "Entrepreneurship",
      aliases: ["Entrepreneurship and Small Business"],
      questions: [
        Q("A company protects its brand name, logo, or slogan from confusingly similar use. Which concept is this?",
          ["Trademark", "Patent", "Copyright", "Trade secret"], 0,
          "A trademark protects brand identifiers such as names, logos, and slogans."),
        Q("An inventor receives government-granted protection for a new and useful invention. What term applies?",
          ["Sole proprietorship", "General partnership", "Limited partnership", "Patent"], 3,
          "A patent protects an invention for a limited period."),
        Q("An author protects an original creative work from unauthorized copying. Which concept is this?",
          ["Competitive advantage", "Innovation", "Copyright", "Corporation"], 2,
          "Copyright protects original creative works from being copied without permission."),
        Q("A company protects a confidential recipe or business process that provides a competitive advantage. Which concept is this?",
          ["Copyright", "Trade secret", "Trademark", "Patent"], 1,
          "A trade secret is confidential business information that stays protected by not being disclosed."),
        Q("An entrepreneur starts a small business alone and keeps control of the business. Which term applies?",
          ["Sole proprietorship", "Trade secret", "General partnership", "Limited partnership"], 0,
          "A sole proprietorship leaves ownership and control with one person."),
        Q("Two or more owners share responsibility for a business and its obligations. What is the correct term?",
          ["Corporation", "Competitive advantage", "Innovation", "General partnership"], 3,
          "General partners share both control and liability for the business."),
        Q("A partner's financial exposure is limited to the amount invested. Which concept is this?",
          ["Patent", "Copyright", "Limited partnership", "Trademark"], 2,
          "A limited partner risks only the amount invested."),
        Q("An entrepreneurial venture forms a separate legal entity and can raise capital by selling stock. Which term applies?",
          ["General partnership", "Corporation", "Trade secret", "Sole proprietorship"], 1,
          "A corporation is legally distinct from its owners and can issue stock."),
        Q("A startup uses a unique strength to stand out from competitors. What is the best answer?",
          ["Competitive advantage", "Limited partnership", "Corporation", "Innovation"], 0,
          "A competitive advantage is the unique strength that differentiates a business."),
        Q("An entrepreneur develops a new solution or improves a product to create value. Which concept is this?",
          ["Trademark", "Patent", "Copyright", "Innovation"], 3,
          "Innovation is creating something new or meaningfully improved that adds value.")
      ]
    },

    /* ============== UNIT 8: FINANCIAL ANALYSIS ============== */
    {
      ia: "Financial Analysis",
      aliases: ["Financial Intelligence", "Finance"],
      questions: [
        Q("A manager reviews revenue and expenses over a one-year period to determine profit. Which statement is this?",
          ["Income statement", "Revenue", "Cost of goods sold", "Gross profit"], 0,
          "An income statement reports revenue and expenses over a period to show profit."),
        Q("A business calculates the total money entering from sales before deductions. What term applies?",
          ["Net profit", "Balance sheet", "Accounts payable", "Revenue"], 3,
          "Revenue is total sales income before any costs are subtracted."),
        Q("A company calculates the costs of materials, labor, packaging, and shipping tied to goods sold. Which concept is this?",
          ["Fixed expense", "Variable expense", "Cost of goods sold", "Accounts receivable"], 2,
          "Cost of goods sold captures the direct costs of producing what was sold."),
        Q("A business subtracts cost of goods sold from revenue before other operating expenses. Which concept is this?",
          ["Cost of goods sold", "Gross profit", "Income statement", "Revenue"], 1,
          "Gross profit is revenue minus cost of goods sold."),
        Q("A company determines what remains after all expenses are deducted. Which term applies?",
          ["Net profit", "Gross profit", "Balance sheet", "Accounts payable"], 0,
          "Net profit is what's left after every expense is accounted for."),
        Q("A manager reviews a company's assets, liabilities, and equity at a specific point in time. What is the correct term?",
          ["Accounts receivable", "Fixed expense", "Variable expense", "Balance sheet"], 3,
          "A balance sheet is a snapshot of assets, liabilities, and equity on one date."),
        Q("A business records money it owes suppliers for purchases that have not yet been paid. Which concept is this?",
          ["Revenue", "Cost of goods sold", "Accounts payable", "Income statement"], 2,
          "Accounts payable is money the business owes to others."),
        Q("A business records money customers owe for purchases that have not yet been paid. Which term applies?",
          ["Balance sheet", "Accounts receivable", "Gross profit", "Net profit"], 1,
          "Accounts receivable is money owed to the business by its customers."),
        Q("A business pays rent that does not change directly with production volume. What is the best answer?",
          ["Fixed expense", "Accounts payable", "Accounts receivable", "Variable expense"], 0,
          "A fixed expense stays the same regardless of how much is produced."),
        Q("A business experiences an expense that changes as its usage or production changes. Which concept is this?",
          ["Income statement", "Revenue", "Cost of goods sold", "Variable expense"], 3,
          "A variable expense rises and falls with production or usage.")
      ]
    },

    /* ======== UNIT 9: HUMAN RESOURCES MANAGEMENT ======== */
    {
      ia: "Human Resources Management",
      aliases: ["HRM", "Human Resources"],
      questions: [
        Q("A company uses a clear hierarchy with senior, middle, and supervisory management. Which structure is this?",
          ["Vertical organization", "Top management", "Middle management", "Supervisory-level management"], 0,
          "A vertical organization is layered, with authority flowing down through clear levels."),
        Q("Executives such as the CEO and CFO set the direction for the entire company. What term applies?",
          ["Horizontal organization", "Matrix organization", "Total rewards system", "Top management"], 3,
          "Top management sets direction for the whole organization."),
        Q("A department manager implements decisions and goals established by top management. Which level is this?",
          ["Self-managing team", "Employee development", "Middle management", "Chain of command"], 2,
          "Middle managers translate top-level goals into department action."),
        Q("A manager oversees employees who carry out day-to-day tasks. Which level is this?",
          ["Middle management", "Supervisory-level management", "Vertical organization", "Top management"], 1,
          "Supervisory-level managers oversee the employees doing daily work."),
        Q("Self-managing teams share decision-making and set their own goals. Which structure is this?",
          ["Horizontal organization", "Supervisory-level management", "Matrix organization", "Total rewards system"], 0,
          "A horizontal organization is flat, with decisions shared rather than layered."),
        Q("Employees report to multiple team leaders while resources are shared across teams. What is the correct term?",
          ["Chain of command", "Self-managing team", "Employee development", "Matrix organization"], 3,
          "A matrix organization gives employees more than one reporting line."),
        Q("A company combines compensation, benefits, work-life balance, recognition, and development. Which concept is this?",
          ["Top management", "Middle management", "Total rewards system", "Vertical organization"], 2,
          "A total rewards system bundles everything of value an employer offers."),
        Q("An employee knows which higher-level manager has authority over their work. Which term applies?",
          ["Matrix organization", "Chain of command", "Supervisory-level management", "Horizontal organization"], 1,
          "The chain of command defines who reports to whom."),
        Q("Employees make decisions and set goals with relatively little traditional hierarchy. What is the best answer?",
          ["Self-managing team", "Total rewards system", "Chain of command", "Employee development"], 0,
          "A self-managing team runs itself without a traditional supervisor."),
        Q("A company invests in opportunities that help employees build skills and capabilities. Which concept is this?",
          ["Vertical organization", "Top management", "Middle management", "Employee development"], 3,
          "Employee development builds the skills and capabilities of staff over time.")
      ]
    },

    /* =========== UNIT 10: INFORMATION MANAGEMENT =========== */
    {
      ia: "Information Management",
      aliases: ["Business Records", "Records Management"],
      questions: [
        Q("A company organizes how information is stored and flows into and out of the business. Which concept is this?",
          ["Information management", "Financial record", "Payroll record", "Personnel record"], 0,
          "Information management governs how business information is stored and moved."),
        Q("A record tracks money entering and leaving the business. What term applies?",
          ["Inventory record", "Legal record", "Descriptive analytics", "Financial record"], 3,
          "Financial records track the money moving through the business."),
        Q("A record tracks employee salaries and changes to compensation. Which record is this?",
          ["Prescriptive analytics", "Data warehouse", "Payroll record", "Predictive analytics"], 2,
          "Payroll records document wages and compensation changes."),
        Q("A record contains employee information such as evaluations and identifying information. Which record is this?",
          ["Payroll record", "Personnel record", "Information management", "Financial record"], 1,
          "Personnel records hold employee information such as evaluations."),
        Q("A record tracks quantities of products and materials held by a business. Which term applies?",
          ["Inventory record", "Personnel record", "Legal record", "Descriptive analytics"], 0,
          "Inventory records track what the business is holding in stock."),
        Q("A business maintains documents such as licenses and patent or copyright agreements. What is the correct term?",
          ["Predictive analytics", "Prescriptive analytics", "Data warehouse", "Legal record"], 3,
          "Legal records hold licenses, agreements, and other legally significant documents."),
        Q("A business converts collected data into useful information describing what has happened. Which concept is this?",
          ["Financial record", "Payroll record", "Descriptive analytics", "Information management"], 2,
          "Descriptive analytics explains what already happened."),
        Q("A company analyzes data to forecast what may happen in the future. Which term applies?",
          ["Legal record", "Predictive analytics", "Personnel record", "Inventory record"], 1,
          "Predictive analytics forecasts likely future outcomes."),
        Q("A system predicts an outcome and recommends a course of action. What is the best answer?",
          ["Prescriptive analytics", "Descriptive analytics", "Predictive analytics", "Data warehouse"], 0,
          "Prescriptive analytics goes past prediction and recommends what to do."),
        Q("A data management system supports business intelligence and analytics across large amounts of information. Which concept is this?",
          ["Information management", "Financial record", "Payroll record", "Data warehouse"], 3,
          "A data warehouse consolidates large volumes of data for analysis.")
      ]
    },

    /* ============== UNIT 11: MARKET PLANNING ============== */
    {
      ia: "Market Planning",
      aliases: ["Marketing Planning", "Market Plan"],
      questions: [
        Q("A company organizes its marketing aims and develops strategies and tactics to achieve them. Which concept is this?",
          ["Market planning", "SWOT analysis", "Strength", "Weakness"], 0,
          "Market planning sets marketing aims and the strategies and tactics to reach them."),
        Q("A business evaluates strengths, weaknesses, opportunities, and threats. What term applies?",
          ["Opportunity", "Threat", "PEST analysis", "SWOT analysis"], 3,
          "A SWOT analysis examines internal strengths and weaknesses alongside external opportunities and threats."),
        Q("A company identifies an internal capability that gives it an advantage. Which concept is this?",
          ["Psychographic segmentation", "Geographic segmentation", "Strength", "Target market"], 2,
          "A strength is an internal advantage the business controls."),
        Q("A company identifies an internal limitation that could hurt performance. Which concept is this?",
          ["Strength", "Weakness", "Market planning", "SWOT analysis"], 1,
          "A weakness is an internal limitation."),
        Q("A business identifies an external condition that could create future growth. Which term applies?",
          ["Opportunity", "Weakness", "Threat", "PEST analysis"], 0,
          "An opportunity is a favorable external condition."),
        Q("A business identifies an external condition that could negatively affect performance. What is the correct term?",
          ["Target market", "Psychographic segmentation", "Geographic segmentation", "Threat"], 3,
          "A threat is an unfavorable external condition."),
        Q("A company examines political, economic, sociocultural, and technological external factors. Which concept is this?",
          ["SWOT analysis", "Strength", "PEST analysis", "Market planning"], 2,
          "A PEST analysis scans the external political, economic, sociocultural, and technological environment."),
        Q("A company identifies the specific group of customers it wants to attract. Which term applies?",
          ["Threat", "Target market", "Weakness", "Opportunity"], 1,
          "The target market is the specific customer group the business aims to serve."),
        Q("Customers are grouped according to personality, lifestyle, or traits. What is the best answer?",
          ["Psychographic segmentation", "PEST analysis", "Target market", "Geographic segmentation"], 0,
          "Psychographic segmentation groups customers by lifestyle, values, and personality."),
        Q("Customers are grouped according to where they are located. Which concept is this?",
          ["Market planning", "SWOT analysis", "Strength", "Geographic segmentation"], 3,
          "Geographic segmentation groups customers by location.")
      ]
    },

    /* ================== UNIT 12: MARKETING ================== */
    {
      ia: "Marketing",
      aliases: ["Marketing Functions", "Functions of Marketing"],
      questions: [
        Q("A business plans how goods will reach customers and how they will be stored and moved. Which marketing function is this?",
          ["Distribution", "Financing", "Marketing information management", "Pricing"], 0,
          "Distribution covers moving and storing goods so they reach customers."),
        Q("A company obtains money through sources such as loans or stock to operate the business. Which function is this?",
          ["Product/service management", "Promotion", "Selling", "Financing"], 3,
          "Financing is obtaining the money needed to run the business."),
        Q("A business gathers data and research to support marketing decisions. Which function is this?",
          ["Place utility", "Time utility", "Marketing information management", "Form utility"], 2,
          "Marketing-information management gathers and uses data to guide decisions."),
        Q("A company determines how much to charge customers for goods or services. Which function is this?",
          ["Marketing information management", "Pricing", "Distribution", "Financing"], 1,
          "Pricing decides what customers will be charged."),
        Q("A business researches customer needs to develop and manage products or services. Which function is this?",
          ["Product/service management", "Pricing", "Promotion", "Selling"], 0,
          "Product/service management develops and maintains offerings around customer needs."),
        Q("A business informs, persuades, or reminds customers about products, services, or the business. Which function is this?",
          ["Form utility", "Place utility", "Time utility", "Promotion"], 3,
          "Promotion communicates with customers to inform, persuade, or remind."),
        Q("A salesperson provides customers with products or services that meet their wants and needs. Which function is this?",
          ["Financing", "Marketing information management", "Selling", "Distribution"], 2,
          "Selling matches customers with products that meet their needs."),
        Q("A manufacturer transforms raw wheat into bread that is useful to consumers. Which utility is this?",
          ["Promotion", "Form utility", "Pricing", "Product/service management"], 1,
          "Form utility is created by changing raw materials into a usable product."),
        Q("A business makes a product available where customers can purchase it. What is the best answer?",
          ["Place utility", "Selling", "Form utility", "Time utility"], 0,
          "Place utility is created by making the product available where customers are."),
        Q("A store makes a product available at a time when customers need it. Which utility is this?",
          ["Distribution", "Financing", "Marketing information management", "Time utility"], 3,
          "Time utility is created by having the product available when it's wanted.")
      ]
    },

    /* ===== UNIT 13: MARKETING-INFORMATION MANAGEMENT ===== */
    {
      ia: "Marketing-Information Management",
      aliases: ["Marketing Information Management", "Marketing Research"],
      questions: [
        Q("A consumer frequently buys a familiar snack with little thought. Which type of decision making is this?",
          ["Routine decision making", "Limited decision making", "Extensive decision making", "Impulse buying"], 0,
          "Routine decision making applies to frequent, low-risk, familiar purchases."),
        Q("A consumer compares a few unfamiliar brands within a familiar product category. Which type is this?",
          ["Primary research", "Secondary research", "Quantitative research", "Limited decision making"], 3,
          "Limited decision making involves some comparison, but within a familiar category."),
        Q("A consumer researches an expensive, unfamiliar, infrequently purchased item such as a car. Which type is this?",
          ["Focus group", "Likert scale", "Extensive decision making", "Qualitative research"], 2,
          "Extensive decision making applies to high-cost, unfamiliar, infrequent purchases."),
        Q("A customer makes an unplanned purchase based on emotion or immediate temptation. Which concept is this?",
          ["Extensive decision making", "Impulse buying", "Routine decision making", "Limited decision making"], 1,
          "Impulse buying is unplanned and emotionally driven."),
        Q("A company conducts its own research to answer a specific marketing question. Which term applies?",
          ["Primary research", "Impulse buying", "Secondary research", "Quantitative research"], 0,
          "Primary research is collected first-hand by the business for its own question."),
        Q("A business uses data that another source has already collected. What is the correct term?",
          ["Qualitative research", "Focus group", "Likert scale", "Secondary research"], 3,
          "Secondary research uses data someone else already gathered."),
        Q("A researcher asks how many customers purchased a product and analyzes numerical results. Which type is this?",
          ["Limited decision making", "Extensive decision making", "Quantitative research", "Routine decision making"], 2,
          "Quantitative research deals in numbers and measurable results."),
        Q("A researcher asks customers why they prefer one product and analyzes words and meanings. Which type is this?",
          ["Secondary research", "Qualitative research", "Impulse buying", "Primary research"], 1,
          "Qualitative research explores reasons, opinions, and meaning."),
        Q("A small, carefully selected group provides feedback about a product or marketing plan. What is the best answer?",
          ["Focus group", "Quantitative research", "Qualitative research", "Likert scale"], 0,
          "A focus group is a small selected group giving guided feedback."),
        Q("A survey asks respondents to rate how likely they are to recommend a business on a numbered scale. Which tool is this?",
          ["Routine decision making", "Limited decision making", "Extensive decision making", "Likert scale"], 3,
          "A Likert scale measures agreement or likelihood on a numbered range.")
      ]
    },

    /* ================== UNIT 14: OPERATIONS ================== */
    {
      ia: "Operations",
      aliases: ["Operations Management", "Purchasing"],
      questions: [
        Q("A business manages activities that occur every day to generate income and protect business value. Which concept is this?",
          ["Operations", "Supply chain management", "Vendor relationship", "Request for proposals"], 0,
          "Operations covers the daily activities that keep the business running."),
        Q("A company coordinates the creation and distribution of finished products from raw materials. What term applies?",
          ["Standing order", "Advance order", "Seasonal order", "Supply chain management"], 3,
          "Supply chain management coordinates the path from raw materials to finished goods."),
        Q("A business maintains positive long-term relationships with suppliers to reduce supply-chain problems. Which concept is this?",
          ["Blanket order", "Quality control", "Vendor relationship", "Open order"], 2,
          "Strong vendor relationships reduce friction and risk in the supply chain."),
        Q("A company asks multiple vendors to submit bids so it can compare terms. Which concept is this?",
          ["Vendor relationship", "Request for proposals", "Operations", "Supply chain management"], 1,
          "A request for proposals invites vendors to bid so terms can be compared."),
        Q("A business orders a set amount of the same products from a vendor at regular intervals. Which order type is this?",
          ["Standing order", "Request for proposals", "Advance order", "Seasonal order"], 0,
          "A standing order repeats automatically at set intervals."),
        Q("A business places an order now for delivery at a later date. What is the correct term?",
          ["Open order", "Blanket order", "Quality control", "Advance order"], 3,
          "An advance order is placed ahead of the delivery date."),
        Q("A retailer orders beach chairs only for the summer season. Which order type is this?",
          ["Supply chain management", "Vendor relationship", "Seasonal order", "Operations"], 2,
          "A seasonal order covers merchandise needed for a specific season."),
        Q("A purchase can be fulfilled by multiple vendors, with the best terms determining who supplies it. Which order type is this?",
          ["Advance order", "Open order", "Request for proposals", "Standing order"], 1,
          "An open order isn't committed to one vendor; the best terms win it."),
        Q("A business places an order covering a variety of products that meet most of its needs. What is the best answer?",
          ["Blanket order", "Seasonal order", "Open order", "Quality control"], 0,
          "A blanket order covers a range of products in a single arrangement."),
        Q("Managers periodically inspect goods and services to check their quality. Which concept is this?",
          ["Operations", "Supply chain management", "Vendor relationship", "Quality control"], 3,
          "Quality control is inspecting output against expected standards.")
      ]
    },

    /* =================== UNIT 15: PRICING =================== */
    {
      ia: "Pricing",
      aliases: ["Pricing Strategies", "Price"],
      questions: [
        Q("A store charges the same listed price for each item in its product range. Which policy is this?",
          ["One-price policy", "Price skimming", "Price fixing", "Predatory pricing"], 0,
          "A one-price policy charges every customer the same posted price."),
        Q("A company launches a new product at a high price and gradually lowers it. Which strategy is this?",
          ["Price discrimination", "Deceptive pricing", "Captive product pricing", "Price skimming"], 3,
          "Price skimming starts high and comes down as the product matures."),
        Q("Competing businesses agree to sell similar products at a fixed price. Which concept is this?",
          ["Price floor", "Price ceiling", "Price fixing", "Cost-plus pricing"], 2,
          "Price fixing is an illegal agreement among competitors to set prices."),
        Q("A company sets prices very low in an attempt to eliminate competitors. Which strategy is this?",
          ["Price fixing", "Predatory pricing", "One-price policy", "Price skimming"], 1,
          "Predatory pricing prices below viability to drive out competition."),
        Q("A business charges different customers different prices for similar products. Which term applies?",
          ["Price discrimination", "Predatory pricing", "Deceptive pricing", "Captive product pricing"], 0,
          "Price discrimination charges different prices to different buyers for the same product."),
        Q("A retailer falsely claims an item had a much higher original price to make a discount look larger. What is the correct term?",
          ["Cost-plus pricing", "Price floor", "Price ceiling", "Deceptive pricing"], 3,
          "Deceptive pricing misrepresents the price to mislead the buyer."),
        Q("A company sells a printer cheaply but charges for proprietary ink required to use it. Which strategy is this?",
          ["Price skimming", "Price fixing", "Captive product pricing", "One-price policy"], 2,
          "Captive product pricing profits from required companion products."),
        Q("A company calculates a unit cost and adds a fixed markup percentage. Which method is this?",
          ["Deceptive pricing", "Cost-plus pricing", "Predatory pricing", "Price discrimination"], 1,
          "Cost-plus pricing adds a set markup to the unit cost."),
        Q("A government establishes the minimum price that can legally be charged for a good or service. What is the best answer?",
          ["Price floor", "Captive product pricing", "Cost-plus pricing", "Price ceiling"], 0,
          "A price floor is a legal minimum price."),
        Q("A government establishes the maximum price that can be charged for a good or service. Which concept is this?",
          ["One-price policy", "Price skimming", "Price fixing", "Price ceiling"], 3,
          "A price ceiling is a legal maximum price.")
      ]
    },

    /* ======== UNIT 16: PRODUCT/SERVICE MANAGEMENT ======== */
    {
      ia: "Product/Service Management",
      aliases: ["Product Service Management", "Product and Service Management", "Product Management"],
      questions: [
        Q("A newly commercialized product receives heavy promotion to create awareness and hype. Which life-cycle stage is this?",
          ["Introduction stage", "Growth stage", "Maturity stage", "Decline stage"], 0,
          "The introduction stage launches the product with heavy promotional effort."),
        Q("A product experiences increasing sales and profits and the company differentiates it from competitors. Which stage is this?",
          ["Product mix width", "Product mix depth", "Product mix length", "Growth stage"], 3,
          "The growth stage brings rising sales and profit as competitors arrive."),
        Q("A product reaches peak market performance and the company focuses on maintaining sales. Which stage is this?",
          ["Reverse brainstorming", "Six Thinking Hats", "Maturity stage", "Product positioning"], 2,
          "Maturity is peak performance, where the focus shifts to holding position."),
        Q("Sales begin to decrease and the company may reduce promotional costs or develop a replacement. Which stage is this?",
          ["Maturity stage", "Decline stage", "Introduction stage", "Growth stage"], 1,
          "In decline, sales fall and the business scales back or replaces the product."),
        Q("A retailer measures the number of product lines it carries. Which measure is this?",
          ["Product mix width", "Decline stage", "Product mix depth", "Product mix length"], 0,
          "Product mix width counts the number of different product lines."),
        Q("A retailer measures the variety of sizes, colors, flavors, or models within a product line. Which measure is this?",
          ["Product positioning", "Reverse brainstorming", "Six Thinking Hats", "Product mix depth"], 3,
          "Product mix depth counts the variations within a single line."),
        Q("A company counts the total number of products it offers. Which measure is this?",
          ["Growth stage", "Maturity stage", "Product mix length", "Introduction stage"], 2,
          "Product mix length is the total number of products across all lines."),
        Q("A company markets a product to create a particular impression or emotion in the target market. Which concept is this?",
          ["Product mix depth", "Product positioning", "Decline stage", "Product mix width"], 1,
          "Product positioning shapes how the product is perceived relative to competitors."),
        Q("A team looks at opposite solutions to a problem and reverses them to find ideas. What is the best answer?",
          ["Reverse brainstorming", "Product mix length", "Product positioning", "Six Thinking Hats"], 0,
          "Reverse brainstorming works backward from how to cause the problem."),
        Q("A team evaluates an idea from six viewpoints including logic, emotion, caution, optimism, creativity, and control. Which technique is this?",
          ["Introduction stage", "Growth stage", "Maturity stage", "Six Thinking Hats"], 3,
          "Six Thinking Hats assigns a different thinking mode to each viewpoint.")
      ]
    },

    /* ========= UNIT 17: PROFESSIONAL DEVELOPMENT ========= */
    {
      ia: "Professional Development",
      aliases: ["Career Development", "Professional Development Skills"],
      questions: [
        Q("A student states exactly what outcome they intend to achieve. Which SMART characteristic is this?",
          ["Specific", "Measurable SMART goal", "Attainable SMART goal", "Relevant SMART goal"], 0,
          "A specific goal states exactly what will be accomplished."),
        Q("A student sets a goal that includes a quantifiable result. Which SMART characteristic is this?",
          ["Time-bound SMART goal", "Operational goal", "Product goal", "Measurable"], 3,
          "A measurable goal includes a number you can check against."),
        Q("A student sets a realistic goal that can actually be achieved. Which SMART characteristic is this?",
          ["Strategic goal", "Tactical goal", "Attainable", "Ideological goal"], 2,
          "An attainable goal is realistic given the resources available."),
        Q("A goal connects directly to an individual's or organization's needs. Which SMART characteristic is this?",
          ["Attainable SMART goal", "Relevant", "Specific SMART goal", "Measurable SMART goal"], 1,
          "A relevant goal ties to what actually matters to the person or business."),
        Q("A goal includes a deadline for checking whether it was achieved. Which SMART characteristic is this?",
          ["Time-bound", "Relevant SMART goal", "Operational goal", "Product goal"], 0,
          "A time-bound goal has a defined deadline."),
        Q("A company sets a goal related to daily operations and productivity. Which goal type is this?",
          ["Ideological goal", "Strategic goal", "Tactical goal", "Operational goal"], 3,
          "Operational goals concern day-to-day running and productivity."),
        Q("A business sets a goal to improve product quality and customer satisfaction. Which goal type is this?",
          ["Measurable SMART goal", "Attainable SMART goal", "Product goal", "Specific SMART goal"], 2,
          "Product goals target quality and customer satisfaction."),
        Q("A company sets a goal focused on employees and positive workplace culture. Which goal type is this?",
          ["Operational goal", "Ideological goal", "Relevant SMART goal", "Time-bound SMART goal"], 1,
          "Ideological goals concern people, values, and culture."),
        Q("A business establishes a long-term goal lasting more than one year. Which goal type is this?",
          ["Strategic goal", "Product goal", "Ideological goal", "Tactical goal"], 0,
          "Strategic goals look beyond one year."),
        Q("A business establishes a short-term goal lasting less than one year. Which goal type is this?",
          ["Specific SMART goal", "Measurable SMART goal", "Attainable SMART goal", "Tactical goal"], 3,
          "Tactical goals are short-term steps toward the strategy.")
      ]
    },

    /* ================== UNIT 18: PROMOTION ================== */
    {
      ia: "Promotion",
      aliases: ["Promotions", "Promotion Strategies"],
      questions: [
        Q("A company promotes its socially responsible image rather than one specific product. Which type of promotion is this?",
          ["Institutional promotion", "Personal selling", "Advertising", "Direct marketing"], 0,
          "Institutional promotion builds the image of the business itself."),
        Q("A salesperson interacts directly with a customer and provides a tailored solution. Which method is this?",
          ["Sales promotion", "Organic marketing", "Shill marketing", "Personal selling"], 3,
          "Personal selling is direct, individualized interaction with a customer."),
        Q("A business pays for a television, radio, or internet message promoting its product. Which method is this?",
          ["Push policy", "Pull policy", "Advertising", "Primary promotion"], 2,
          "Advertising is paid promotional messaging through media."),
        Q("A company sends targeted promotional emails to specific customers. Which method is this?",
          ["Advertising", "Direct marketing", "Institutional promotion", "Personal selling"], 1,
          "Direct marketing targets specific customers with a direct message."),
        Q("A retailer offers a short-term buy-one-get-one-free incentive. Which method is this?",
          ["Sales promotion", "Direct marketing", "Organic marketing", "Shill marketing"], 0,
          "Sales promotions are short-term incentives that push immediate purchases."),
        Q("A brand gains attention naturally through engaging content without direct paid promotion. What is the correct term?",
          ["Primary promotion", "Push policy", "Pull policy", "Organic marketing"], 3,
          "Organic marketing earns attention without paying for placement."),
        Q("Employees pretend to be customers and post fake positive reviews. Which concept is this?",
          ["Personal selling", "Advertising", "Shill marketing", "Institutional promotion"], 2,
          "Shill marketing disguises company employees as ordinary customers, and is unethical."),
        Q("An industry campaign promotes demand for an entire category, such as milk. Which type is this?",
          ["Organic marketing", "Primary promotion", "Direct marketing", "Sales promotion"], 1,
          "Primary promotion builds demand for a whole product category rather than one brand."),
        Q("A manufacturer promotes a product to intermediaries such as retailers. Which policy is this?",
          ["Push policy", "Shill marketing", "Primary promotion", "Pull policy"], 0,
          "A push policy directs promotion at channel intermediaries."),
        Q("A company promotes a product directly to consumers to create demand that pulls the product through the channel. Which policy is this?",
          ["Institutional promotion", "Personal selling", "Advertising", "Pull policy"], 3,
          "A pull policy builds consumer demand so retailers stock the product.")
      ]
    },

    /* ============ UNIT 19: QUALITY MANAGEMENT ============ */
    {
      ia: "Quality Management",
      aliases: ["Quality Control", "Quality"],
      questions: [
        Q("Managers inspect goods and services periodically to ensure they meet expected standards. Which concept is this?",
          ["Quality control", "Quality circle", "Benchmarking", "Continuous improvement"], 0,
          "Quality control checks output against the expected standard."),
        Q("A group of employees meets to solve a company problem as part of continuous improvement. What term applies?",
          ["Grade", "Prime grade", "Full warranty", "Quality circle"], 3,
          "A quality circle is a small employee group that meets to solve quality problems."),
        Q("A business compares its processes and performance with industry best practices. Which concept is this?",
          ["Implied warranty", "Express warranty", "Benchmarking", "Limited warranty"], 2,
          "Benchmarking measures the business against recognized best practice."),
        Q("A company repeatedly makes incremental changes to improve products, services, or processes. Which concept is this?",
          ["Benchmarking", "Continuous improvement", "Quality control", "Quality circle"], 1,
          "Continuous improvement is ongoing incremental refinement."),
        Q("A business classifies a product according to its level of quality, such as A, B, or C. Which term applies?",
          ["Grade", "Continuous improvement", "Prime grade", "Full warranty"], 0,
          "A grade classifies a product by quality level."),
        Q("A meat product is classified at the highest quality level. What is the correct term?",
          ["Limited warranty", "Implied warranty", "Express warranty", "Prime grade"], 3,
          "Prime is the top grade classification."),
        Q("A seller promises to make a defective product right within a reasonable time under the warranty. Which warranty is this?",
          ["Quality circle", "Benchmarking", "Full warranty", "Quality control"], 2,
          "A full warranty commits the seller to remedy defects without major limits."),
        Q("A warranty covers only specified parts, repairs, or a defined period rather than the entire product. Which warranty is this?",
          ["Prime grade", "Limited warranty", "Continuous improvement", "Grade"], 1,
          "A limited warranty restricts what is covered or for how long."),
        Q("A customer and seller understand that a product should perform as expected even without an explicit written promise. Which warranty is this?",
          ["Implied warranty", "Full warranty", "Limited warranty", "Express warranty"], 0,
          "An implied warranty exists by law without being written down."),
        Q("A seller makes a specific stated promise about a product's quality. Which warranty is this?",
          ["Quality control", "Quality circle", "Benchmarking", "Express warranty"], 3,
          "An express warranty is a specific promise the seller actually states.")
      ]
    },

    /* ============= UNIT 20: RISK MANAGEMENT ============= */
    {
      ia: "Risk Management",
      aliases: ["Risk", "Enterprise Risk Management"],
      questions: [
        Q("A business shifts financial exposure to another organization, typically through insurance. Which concept is this?",
          ["Risk transfer", "Risk prevention", "Risk retention", "Compliance risk"], 0,
          "Risk transfer moves the financial consequence to another party, usually an insurer."),
        Q("A business takes action to stop a potential risk from occurring. What term applies?",
          ["Legal risk", "Strategic risk", "Reputational risk", "Risk prevention"], 3,
          "Risk prevention stops the risk from happening in the first place."),
        Q("A business chooses to keep the risk rather than transfer it to another organization. Which concept is this?",
          ["Security risk", "Financial risk", "Risk retention", "Operational risk"], 2,
          "Risk retention means accepting and absorbing the risk yourself."),
        Q("A company may violate external laws, regulations, or internal standards. Which risk is this?",
          ["Risk retention", "Compliance risk", "Risk transfer", "Risk prevention"], 1,
          "Compliance risk is the risk of failing to meet rules the business is bound by."),
        Q("A business faces a specific violation of government regulations. Which risk is this?",
          ["Legal risk", "Compliance risk", "Strategic risk", "Reputational risk"], 0,
          "Legal risk is exposure to legal action or regulatory violation."),
        Q("A poor strategy or failure by executives to follow strategy threatens company objectives. Which risk is this?",
          ["Operational risk", "Security risk", "Financial risk", "Strategic risk"], 3,
          "Strategic risk comes from the strategy itself, or from failing to execute it."),
        Q("A negative event threatens the public's opinion of the company. Which risk is this?",
          ["Risk prevention", "Risk retention", "Reputational risk", "Risk transfer"], 2,
          "Reputational risk threatens how the public sees the business."),
        Q("A problem with day-to-day business activities reduces profits. Which risk is this?",
          ["Strategic risk", "Operational risk", "Compliance risk", "Legal risk"], 1,
          "Operational risk arises from everyday processes going wrong."),
        Q("A company faces cybersecurity or physical-security threats. Which risk is this?",
          ["Security risk", "Reputational risk", "Operational risk", "Financial risk"], 0,
          "Security risk covers threats to data, systems, and physical property."),
        Q("A business faces problems involving debt management or financial planning. Which risk is this?",
          ["Risk transfer", "Risk prevention", "Risk retention", "Financial risk"], 3,
          "Financial risk concerns debt, cash flow, and financial planning.")
      ]
    },

    /* =================== UNIT 21: SELLING =================== */
    {
      ia: "Selling",
      aliases: ["Sales", "Selling Function"],
      questions: [
        Q("A salesperson sells products or services from one business to another business. Which concept is this?",
          ["B2B selling", "B2C selling", "Preparing to sell", "Establishing relationships"], 0,
          "B2B selling is business-to-business."),
        Q("A salesperson sells a product directly to an end consumer. What term applies?",
          ["Discovering customer needs", "Prescribing solutions", "Reaching closure", "B2C selling"], 3,
          "B2C selling is business-to-consumer."),
        Q("A salesperson learns product information and identifies features and benefits before meeting the customer. Which step is this?",
          ["Feature", "Benefit", "Preparing to sell", "Reaffirming buyer-seller relationships"], 2,
          "Preparing to sell is the product knowledge work done before the customer interaction."),
        Q("A salesperson puts a customer at ease and builds confidence during the beginning of a sale. Which step is this?",
          ["Preparing to sell", "Establishing relationships", "B2B selling", "B2C selling"], 1,
          "Establishing the relationship opens the sale and builds trust."),
        Q("A salesperson asks questions and listens to diagnose what the customer needs. Which step is this?",
          ["Discovering customer needs", "Establishing relationships", "Prescribing solutions", "Reaching closure"], 0,
          "Discovering customer needs comes from questioning and listening."),
        Q("A salesperson demonstrates a product and explains how it solves the customer's problem. Which step is this?",
          ["Reaffirming buyer-seller relationships", "Feature", "Benefit", "Prescribing solutions"], 3,
          "Prescribing solutions connects the product to the customer's specific problem."),
        Q("A salesperson handles objections and completes the sale. Which step is this?",
          ["B2C selling", "Preparing to sell", "Reaching closure", "B2B selling"], 2,
          "Reaching closure resolves objections and finishes the sale."),
        Q("A salesperson reassures the customer after purchase and answers questions. Which step is this?",
          ["Prescribing solutions", "Reaffirming buyer-seller relationships", "Establishing relationships", "Discovering customer needs"], 1,
          "Reaffirming the relationship happens after the purchase, to reinforce the decision."),
        Q("A salesperson describes a physical characteristic of a product. What is the best answer?",
          ["Feature", "Reaching closure", "Reaffirming buyer-seller relationships", "Benefit"], 0,
          "A feature is a physical or functional characteristic."),
        Q("A salesperson explains the advantage a customer receives from a product. Which concept is this?",
          ["B2B selling", "B2C selling", "Preparing to sell", "Benefit"], 3,
          "A benefit is the advantage the customer gets from a feature.")
      ]
    },

    /* ============ UNIT 22: STRATEGIC MANAGEMENT ============ */
    {
      ia: "Strategic Management",
      aliases: ["Strategic Management and Planning", "Management"],
      questions: [
        Q("A company identifies, assesses, and prioritizes risks that could affect its objectives and develops mitigation strategies. Which concept is this?",
          ["Enterprise risk management", "CMMI", "Planning", "Organizing"], 0,
          "Enterprise risk management identifies, prioritizes, and mitigates risk across the business."),
        Q("A company uses a process-improvement model developed by Carnegie Mellon University. What term applies?",
          ["Controlling", "Directing", "First-line manager", "CMMI"], 3,
          "Capability Maturity Model Integration is Carnegie Mellon's process-improvement model."),
        Q("A manager sets objectives and develops strategies and action plans to achieve them. Which function is this?",
          ["Regional manager", "Executive manager", "Planning", "Mid-level manager"], 2,
          "Planning sets objectives and the strategies to reach them."),
        Q("A manager coordinates people, equipment, money, roles, and responsibilities to implement plans. Which function is this?",
          ["Planning", "Organizing", "Enterprise risk management", "CMMI"], 1,
          "Organizing arranges resources and responsibilities to carry out the plan."),
        Q("A manager measures actual performance against standards and makes adjustments. Which function is this?",
          ["Controlling", "Organizing", "Directing", "First-line manager"], 0,
          "Controlling compares results to standards and corrects the gap."),
        Q("A manager leads and motivates employees and communicates the plan. Which function is this?",
          ["Mid-level manager", "Regional manager", "Executive manager", "Directing"], 3,
          "Directing is leading, motivating, and communicating."),
        Q("A manager oversees day-to-day activities and first-line employees. Which level is this?",
          ["CMMI", "Planning", "First-line manager", "Enterprise risk management"], 2,
          "First-line managers supervise the employees doing daily work."),
        Q("A manager oversees employees and implements strategies established by upper management. Which level is this?",
          ["Directing", "Mid-level manager", "Organizing", "Controlling"], 1,
          "Mid-level managers carry out the strategy set above them."),
        Q("A manager oversees multiple locations within a geographic region. Which level is this?",
          ["Regional manager", "First-line manager", "Mid-level manager", "Executive manager"], 0,
          "A regional manager is responsible for several locations in an area."),
        Q("A manager oversees the entire organization and makes high-level decisions. Which level is this?",
          ["Enterprise risk management", "CMMI", "Planning", "Executive manager"], 3,
          "Executive managers lead the whole organization.")
      ]
    }

  ];

  /* ---- deterministic option shuffle --------------------------------------
     The source answer key ran A, D, C, B repeating in every unit, which is
     learnable as a pattern instead of as content. This scrambles each
     question's options and moves the answer index with them. The seed comes
     from the question text, so the same question always shuffles the same way
     and re-importing stays a clean no-op. */

  function seedFrom(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shuffleQuestion(question) {
    let seed = seedFrom(question.q);
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const paired = question.options.map((opt, i) => ({ opt, correct: i === question.answer }));
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    return {
      q: question.q,
      options: paired.map(p => p.opt),
      answer: paired.findIndex(p => p.correct),
      explanation: question.explanation
    };
  }

  window.F4G_QUESTION_BANK_ENT = BANK.map(entry => ({
    ia: entry.ia,
    aliases: entry.aliases,
    questions: entry.questions.map(shuffleQuestion)
  }));

  console.log(
    "Entrepreneurship question bank loaded: " +
    window.F4G_QUESTION_BANK_ENT.length + " areas, " +
    window.F4G_QUESTION_BANK_ENT.reduce((n, e) => n + e.questions.length, 0) + " questions.\n" +
    "To import:\n" +
    "  window.F4G_QUESTION_BANK = window.F4G_QUESTION_BANK_ENT;\n" +
    '  f4gImportQuestions({ courseId: "entrepreneurship-cluster" })'
  );
})();
