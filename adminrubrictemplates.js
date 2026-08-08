/* =========================================================================
   Farm4Glass — Admin > Rubrics template loader
   DECA Guide 2026-27: ORS (5), Project Management (6), IMC (3)

   Adds a "Load 2026-27 template" picker above your existing Rubrics form.
   Pick an event, click Fill, then click your own Save button.

   It writes into the fields you already have by matching their placeholder
   text, so it doesn't need to know your Firestore schema and it saves
   through your existing save path. Nothing is written to the database by
   this file.

   Install:
     <script src="admin-rubric-templates.js"></script>
   after your admin markup (or anywhere — it waits for the form to exist).
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. SHARED BLOCKS
     ------------------------------------------------------------------ */

  var PENALTIES_WRITTEN =
    "Statement of Assurances missing, unsigned, or signed with a typed name instead of a real signature || 15\n" +
    "Body exceeds 20 pages, counting the appendix but not the title page or table of contents || 5\n" +
    "Pages not numbered in sequence from the executive summary through the final appendix page, or separate divider/title pages used between sections || 5\n" +
    "Written entry does not follow the required section outline or a required section is untitled || 5\n" +
    "Entry not typed, not on 8.5 x 11 inch pages, or contains handwritten corrections, notes, charts or graphs || 5";

  var PENALTIES_DECK =
    "Statement of Assurances missing, unsigned, or signed with a typed name instead of a real signature || 15\n" +
    "Pitch deck exceeds 20 slides, counting the appendix || 5\n" +
    "Slides not numbered in sequence from the title slide through the final appendix slide || 5\n" +
    "Pitch deck does not follow the required section outline or a required section is untitled || 5\n" +
    "Deck not typed, not in 16:9 aspect ratio, or contains handwritten corrections, notes, charts or graphs || 5";

  /* ------------------------------------------------------------------
     2. FAMILY TEMPLATES
     ------------------------------------------------------------------ */

  var FAMILIES = {

    ORS: {
      category: "Business Operations Research Event",
      pageLimit: "20",
      wordLimit: "",
      required:
        "Statement of Assurances || 15\n" +
        "Table of Contents\n" +
        "Executive Summary\n" +
        "Introduction\n" +
        "Research Methods Used in the Study\n" +
        "Findings and Conclusions of the Study\n" +
        "Proposed Strategic Plan\n" +
        "Proposed Budget\n" +
        "Bibliography",
      penalties: PENALTIES_WRITTEN,
      rubric:
        "Executive Summary || Clear, concise, well-structured, one to three pages, covering the key aspects of the project (10 pts)\n" +
        "Introduction || Describes the business or organization, its primary products or services, purpose/mission, target market with demographics and psychographics, and its current strategy for customer loyalty and repeat engagement (8 pts)\n" +
        "Research Methods - Description and Rationale || Explains which methodologies were chosen (qualitative, quantitative, primary, secondary) and why, in relation to the study's goals, with a clear explanation of the data collection process (8 pts)\n" +
        "Research Methods - Execution || Conducts and implements the selected methods in a clear, organized, professional way; the methods are easy to understand, logical and thorough (8 pts)\n" +
        "Findings || Interprets and connects the research findings to the study's objectives and questions with clarity and support (8 pts)\n" +
        "Conclusions || Draws logical, evidence-based conclusions that are genuinely supported by the findings (8 pts)\n" +
        "Strategic Plan - Objectives and Rationale || Proposes actionable objectives with a practical rationale built on the data, research and logical analysis (12 pts)\n" +
        "Strategic Plan - Activities and Timelines || Proposes actionable, logical activities with realistic timelines that support implementation (12 pts)\n" +
        "Strategic Plan - Metrics and KPIs || Proposes effective metrics or key performance indicators to measure the plan's effectiveness (12 pts)\n" +
        "Proposed Budget || Identifies all costs, explains the cost rationale, addresses financial viability, and considers potential ROI or financial benefit (8 pts)\n" +
        "Professional Standards || Professional layout, appropriate business language, correct grammar (6 pts)",
      notes:
        "2026-2027 required topic: collaborate with a local business or organization to research what drives customer loyalty and repeat engagement, then build a strategic plan to strengthen customer retention through loyalty programs, personalized experiences or relationship-building initiatives. An otherwise strong entry on a different topic will lose heavily.\n\n" +
        "Front matter: Statement of Assurances first, signed by all participants and the chapter advisor, not page-numbered. Title page next (event name, high school, school address, city/state/ZIP, participant names, date), not numbered. Table of contents follows, may be single-spaced and more than one page, not numbered. The body starts at Executive Summary, numbered page 1.\n\n" +
        "Every section must be titled, including the bibliography and the appendix. Additional subsections are allowed inside the body. The appendix is optional but its pages are numbered and count toward the 20.\n\n" +
        "1-3 participants, all must present. Written entry 100 pts + 15-minute presentation 100 pts = 200 total, minus penalties. Participants are hired consultants; the judge is the owner/manager.",
      events: [
        ["Business Services Operations Research", "BOR"],
        ["Buying and Merchandising Operations Research", "BMOR"],
        ["Finance Operations Research", "FOR"],
        ["Hospitality and Tourism Operations Research", "HTOR"],
        ["Sports and Entertainment Marketing Operations Research", "SEOR"]
      ]
    },

    PM: {
      category: "Project Management Event",
      pageLimit: "20",
      wordLimit: "",
      required:
        "Statement of Assurances || 15\n" +
        "Table of Contents\n" +
        "Executive Summary\n" +
        "Initiating\n" +
        "Planning and Organizing\n" +
        "Execution\n" +
        "Monitoring and Controlling\n" +
        "Closing the Project\n" +
        "Bibliography",
      penalties: PENALTIES_WRITTEN,
      rubric:
        "Executive Summary || Clear, concise, well-structured, one to three pages, covering all key aspects of the project (10 pts)\n" +
        "Initiating || Clearly defines the need or opportunity and articulates the project scope - purpose, rationale, expected benefits - with depth of understanding and real-world relevance (10 pts)\n" +
        "Planning and Organizing || Develops and justifies interconnected components: project goals, human resource plan with roles and strengths, schedule with 2-4 milestones and timelines, quality plan with key metrics, risk plan with issues and response strategies, and a budget including in-kind donations. Shows strategic foresight, prioritization and alignment with the goals (20 pts)\n" +
        "Execution || Compelling, well-supported narrative and documentation of how the plan was actually implemented, highlighting team coordination, adaptation and decision-making in action (20 pts)\n" +
        "Monitoring and Controlling || Shows how feedback, data and checkpoints were actively used to assess progress, resolve challenges and hold alignment across schedule, quality and budget (10 pts)\n" +
        "Closing the Project || Evaluates overall success against the key metrics, extracts lessons learned across all four process groups with real insight, and offers forward-thinking recommendations (20 pts)\n" +
        "Professional Standards || Professional layout, appropriate business language, correct grammar (10 pts)",
      notes:
        "The project may begin any time after the close of the previous year's chartered association conference and run to the beginning of the next one. A project may be submitted in only one event category.\n\n" +
        "Originality: judges reward original projects. Teams should do more than update last year's entry, and committees should avoid even reviewing it. Plagiarism of a previously judged project automatically disqualifies the chapter.\n\n" +
        "Front matter: Statement of Assurances signed and not page-numbered. Title page (event name, high school, school address, city/state/ZIP, participant names, date), not numbered. Table of contents, not numbered. Body starts at Executive Summary, numbered page 1.\n\n" +
        "Every section must be titled, including the bibliography and the appendix. The appendix is optional but its pages are numbered and count toward the 20.\n\n" +
        "1-3 participants, all must present. Written entry 100 pts + 15-minute presentation 100 pts = 200 total, minus penalties. Participants are project managers.",
      events: [
        ["Business Solutions Project", "PMBS"],
        ["Career Development Project", "PMCD"],
        ["Community Awareness Project", "PMCA"],
        ["Community Giving Project", "PMCG"],
        ["Financial Literacy Project", "PMFL"],
        ["Sales Project", "PMSP"]
      ]
    },

    IMC: {
      category: "Integrated Marketing Campaign Event",
      pageLimit: "20",
      wordLimit: "",
      required:
        "Statement of Assurances || 15\n" +
        "Table of Contents\n" +
        "Overview\n" +
        "Campaign Objectives\n" +
        "Campaign Target Market\n" +
        "Research, Insights, Connection to the Campaign\n" +
        "Campaign Strategy, Activities and Schedule\n" +
        "Proposed Budget\n" +
        "Impact and Measurement\n" +
        "Bibliography",
      penalties: PENALTIES_DECK,
      rubric:
        "Knowledge of Industry/Brand || Clear, thorough understanding of the industry, the organization, and the product or service's position within its industry (5 pts)\n" +
        "Business Opportunity || Explains the business opportunity, goals and objectives, and the target market (5 pts)\n" +
        "Research, Insights and Connection to Campaign || Explains the research method and results, and how the findings inform the next steps. Should cover cultural, social, economic and technological influences plus media consumption patterns that shape audience behavior (15 pts)\n" +
        "Campaign Strategy || Proposes feasible ideas and solutions grounded in data and analysis that genuinely solve the business opportunity, using creativity and innovative concepts (15 pts)\n" +
        "Campaign Activities and Schedule || Outlines actionable strategic activities with realistic timelines, aligning target markets, channels and activities. Campaign must be 45 days or fewer and include creative samples of the marketing collateral (15 pts)\n" +
        "Proposed Budget || Justifies campaign costs, identifies key expenses, and addresses financial viability (10 pts)\n" +
        "Impact and Measurement || Proposes relevant metrics and key indicators to capture and measure campaign results and effectiveness (10 pts)\n" +
        "Organization || Information is presented in a logical sequence that is easy to follow (5 pts)\n" +
        "Effectiveness || Persuades, informs or inspires by communicating a clear message (5 pts)\n" +
        "Delivery || Engages the audience through interactive techniques such as visual storytelling (5 pts)\n" +
        "Presentation Design || Visual aids and themes are used throughout and are appropriate, professional and add value (5 pts)\n" +
        "Overall Impression || Demonstrates career readiness through professionalism, poise and confidence (5 pts)",
      notes:
        "This is a PITCH DECK, not a written entry - the limit is 20 SLIDES including the appendix, not 20 pages.\n\n" +
        "There is no separate written-entry evaluation form for IMC. The deck is scored entirely through the 100-point Presentation Evaluation Form, so the rubric above mixes content items and delivery items. When grading a deck alone, judge the delivery items on how well the material would support them.\n\n" +
        "Slide numbering is unusual: the cover slide is first and does not need to be numbered 1. The title slide is numbered 2 and carries the event name, high school, school address, city/state/ZIP, participant names and date. The table of contents is numbered 3 and must be only one slide. The body starts at Overview, numbered 4.\n\n" +
        "The Statement of Assurances is submitted as a SEPARATE document and is not part of the slide numbering.\n\n" +
        "Campaign must be no more than 45 days in length for a real event, product or service.\n\n" +
        "Presentation score is weighted twice the value of the 100-question cluster exam (Business Administration Core + Marketing Cluster performance indicators). The exam score carries into the final round.\n\n" +
        "1-3 participants, all must present and answer questions. 15-minute presentation. Participants are account managers at a marketing agency; the judge is a prospective client.",
      events: [
        ["Integrated Marketing Campaign - Event", "IMCE"],
        ["Integrated Marketing Campaign - Product", "IMCP"],
        ["Integrated Marketing Campaign - Service", "IMCS"]
      ]
    }
  };

  /* Flatten into a single lookup keyed by event code. */
  var TEMPLATES = {};
  Object.keys(FAMILIES).forEach(function (fid) {
    var f = FAMILIES[fid];
    f.events.forEach(function (pair) {
      TEMPLATES[pair[1]] = {
        familyId: fid,
        name: pair[0],
        code: pair[1],
        category: f.category,
        pageLimit: f.pageLimit,
        wordLimit: f.wordLimit,
        required: f.required,
        penalties: f.penalties,
        rubric: f.rubric,
        notes: f.notes
      };
    });
  });

  /* ------------------------------------------------------------------
     3. FIELD MATCHING — finds your existing inputs by placeholder text
     ------------------------------------------------------------------ */

  var FIELD_HINTS = {
    name: "event name",
    code: "event code",
    category: "category",
    pageLimit: "page limit",
    wordLimit: "word limit",
    required: "text the entry must contain",
    penalties: "one penalty rule per line",
    rubric: "one rubric section per line",
    notes: "any extra guideline notes"
  };

  function allFields() {
    return Array.prototype.slice.call(
      document.querySelectorAll("input[placeholder], textarea[placeholder]")
    );
  }

  function findField(hint) {
    var fields = allFields();
    for (var i = 0; i < fields.length; i++) {
      var ph = (fields[i].getAttribute("placeholder") || "").toLowerCase();
      if (ph.indexOf(hint) !== -1) return fields[i];
    }
    return null;
  }

  function setValue(el, value) {
    if (!el) return false;
    var proto = el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function fillTemplate(code) {
    var t = TEMPLATES[code];
    if (!t) return { ok: false, msg: "Unknown event code." };

    var missing = [];
    var map = {
      name: t.name,
      code: t.code,
      category: t.category,
      pageLimit: t.pageLimit,
      wordLimit: t.wordLimit,
      required: t.required,
      penalties: t.penalties,
      rubric: t.rubric,
      notes: t.notes
    };

    Object.keys(map).forEach(function (key) {
      var el = findField(FIELD_HINTS[key]);
      if (!el) { missing.push(key); return; }
      setValue(el, map[key]);
    });

    if (missing.length === Object.keys(map).length) {
      return { ok: false, msg: "Couldn't find the rubric form on this page." };
    }
    if (missing.length) {
      return { ok: true, msg: "Filled. Couldn't find: " + missing.join(", ") + ". Check those by hand, then Save." };
    }
    return { ok: true, msg: "Filled " + t.name + " (" + t.code + "). Review it, then hit Save." };
  }

  /* ------------------------------------------------------------------
     4. PICKER UI — inherits your existing styles, adds no colors
     ------------------------------------------------------------------ */

  function buildPicker() {
    if (document.getElementById("f4g-rubric-template-bar")) return true;

    var anchor = findField(FIELD_HINTS.name);
    if (!anchor) return false;

    var bar = document.createElement("div");
    bar.id = "f4g-rubric-template-bar";
    bar.style.cssText =
      "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 14px 0;font:inherit;";

    var label = document.createElement("span");
    label.textContent = "Load 2026-27 template:";
    label.style.cssText = "font:inherit;font-size:0.9em;opacity:0.75;";

    var select = document.createElement("select");
    select.id = "f4g-rubric-template-select";
    select.style.cssText =
      "font:inherit;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,0.15);" +
      "background:transparent;color:inherit;flex:1 1 260px;min-width:200px;";

    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Choose an event...";
    select.appendChild(blank);

    Object.keys(FAMILIES).forEach(function (fid) {
      var f = FAMILIES[fid];
      var group = document.createElement("optgroup");
      group.label = f.category.replace(/ Event$/, " Events");
      f.events.forEach(function (pair) {
        var opt = document.createElement("option");
        opt.value = pair[1];
        opt.textContent = pair[1] + " — " + pair[0];
        group.appendChild(opt);
      });
      select.appendChild(group);
    });

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Fill form";
    btn.style.cssText =
      "font:inherit;padding:8px 16px;border-radius:10px;border:1px solid rgba(0,0,0,0.15);" +
      "background:transparent;color:inherit;cursor:pointer;";

    var status = document.createElement("div");
    status.style.cssText = "flex:1 1 100%;font:inherit;font-size:0.85em;opacity:0.75;min-height:1.2em;";

    btn.addEventListener("click", function () {
      var code = select.value;
      if (!code) { status.textContent = "Pick an event first."; return; }
      var res = fillTemplate(code);
      status.textContent = res.msg;
    });

    bar.appendChild(label);
    bar.appendChild(select);
    bar.appendChild(btn);
    bar.appendChild(status);

    var host = anchor.parentNode;
    host.insertBefore(bar, anchor);
    return true;
  }

  /* The admin tab may render after load, so keep watching for the form. */
  function init() {
    if (buildPicker()) return;
    var observer = new MutationObserver(function () {
      if (buildPicker()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ------------------------------------------------------------------
     5. EXPORTS — for console use or wiring into your own button
     ------------------------------------------------------------------ */

  window.RUBRIC_TEMPLATES = TEMPLATES;
  window.fillRubricTemplate = fillTemplate;
})();
