(() => {
"use strict";

const STORAGE_KEY = "holtonHomesCRM_v25";
const LEGACY_KEYS = ["holtonHomesCRM_v24","holtonHomesCRM_v23","holtonHomesCRM_v22","holtonHomesCRM_v21","holtonHomesCRM_v20","holtonHomesCRM_v19","holtonHomesCRM_v18","holtonHomesCRM_v17","holtonHomesCRM_v16","holtonHomesCRM_v15","holtonHomesCRM_v14","holtonHomesCRM_v13","holtonHomesCRM_v12","holtonHomesCRM_v11","holtonHomesCRM_v10","holtonHomesBusinessBuilder_v7","holtonHomesCRM"];
const TODAY = () => new Date().toISOString().slice(0,10);
const NOW = () => new Date().toISOString();
const sellerStages = ["New","Attempted Contact","Contacted","Nurture","Valuation Requested","Valuation Delivered","Listing Appointment","Follow-Up","Listing Agreement Signed","Coming Soon","Active Listing","Offer Received","Under Contract","Closed","Lost"];
const buyerStages = ["New","Attempted Contact","Contacted","Nurture","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract","Closed","Lost"];
const sources = ["Sphere","Referral","Social Media","Website","Open House","Farm / Homestead Brand","Cold Outreach","Sign Call","Past Client","Other"];
const behaviorTypes = ["Viewed Property","Saved Property","Repeated Property View","Requested Showing","Home Valuation","Opened Email","Clicked Property Alert","Searched Website"];

const defaultTemplates = [
  {id:"tpl-new-seller",name:"New seller introduction",channel:"Text",category:"Seller",subject:"",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I saw your real estate inquiry and wanted to personally reach out. What has you thinking about a move?"},
  {id:"tpl-seller-followup",name:"Seller follow-up",channel:"Text",category:"Seller",subject:"",body:"Hi {{first_name}}, I wanted to circle back about {{property}}. Has anything changed with your timing or what you would need from a sale?"},
  {id:"tpl-listing-confirm",name:"Listing appointment confirmation",channel:"Text",category:"Seller",subject:"",body:"Hi {{first_name}}, confirming our appointment for {{property}}. I’ll come prepared with the market, pricing range, and a clear selling plan. Is everyone involved in the decision able to attend?"},
  {id:"tpl-valuation",name:"Valuation follow-up",channel:"Email",category:"Seller",subject:"Your home value and next options",body:"Hi {{first_name}},\n\nI finished reviewing {{property}} and the surrounding market. I would like to walk you through the value range, the factors that could move it, and whether selling now actually supports your goals.\n\n— {{agent_name}}\nHolton Homes"},
  {id:"tpl-new-buyer",name:"New buyer introduction",channel:"Text",category:"Buyer",subject:"",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. What monthly payment, area, and move timeline would feel comfortable for you?"},
  {id:"tpl-past-client",name:"Past-client check-in",channel:"Text",category:"Relationship",subject:"",body:"Hi {{first_name}}, I was thinking about you and wanted to see how everything is going with the home. How have you been?"},
  {id:"tpl-referral-thanks",name:"Referral thank-you",channel:"Text",category:"Relationship",subject:"",body:"Hi {{first_name}}, thank you for thinking of me and Holton Homes. I really appreciate the introduction and will take great care of them."}
];


const defaultCallScripts = [
  {
    id:"script-new-seller",name:"New seller lead",category:"New Seller",
    goal:"Learn why a move is being considered, who is involved, and whether a clear next meeting makes sense.",
    opener:"Hey {{first_name}}, this is {{agent_name}} with Holton Homes. Did I catch you at an okay time? I wanted to personally reach out about your real estate inquiry.",
    questions:[
      "What has you thinking about a move right now?",
      "What would need to happen for selling to make sense?",
      "When would you ideally like to make a decision?",
      "Who else should be involved in the conversation?",
      "Have you already spoken with another agent?"
    ],
    close:"Based on what you shared, the best next step is for me to review the home and the market, then show you the realistic options. Would {{appointment_day}} work for a quick meeting?",
    voicemail:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I’m following up about your real estate inquiry. No rush—call or text me at {{agent_phone}} when you have a minute.",
    afterVoicemailText:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I just left you a quick voicemail about your real estate inquiry. What has you thinking about a possible move?",
    objections:[
      {label:"We’re just curious",response:"That makes complete sense. You do not need to be ready to list. What are you most curious about—the value, timing, or what you would walk away with?"},
      {label:"We’re not ready",response:"That is okay. My job is not to force the timing. What would have to change before moving became realistic?"},
      {label:"We already have an agent",response:"Got it. Are you already formally committed, or have you only had an early conversation? I do not want to interfere with an existing agreement."},
      {label:"Just send a price",response:"I can give you a range, but the useful number depends on condition, competition, and your goal. Let me ask two quick questions so I do not send you a meaningless automated estimate."}
    ]
  },
  {
    id:"script-valuation",name:"Home valuation conversation",category:"Valuation",
    goal:"Turn a value request into a useful conversation about motivation, timing, equity, and the next step.",
    opener:"Hey {{first_name}}, it’s {{agent_name}} with Holton Homes. I’ve been looking at {{property}} and wanted to explain what is actually driving the value instead of just throwing an automated number at you.",
    questions:[
      "What prompted you to check the value now?",
      "What updates or condition details would not show in public records?",
      "Is the goal to sell, refinance, plan ahead, or simply understand the equity?",
      "Would you need to buy another home before selling?",
      "What number were you hoping the home might support?"
    ],
    close:"I can tighten this range by seeing the property and understanding the condition. Let’s schedule a short walkthrough so I can give you a number I would actually defend.",
    voicemail:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I finished an initial look at {{property}} and have a few details that could materially change the value. Call or text me at {{agent_phone}}.",
    afterVoicemailText:"Hi {{first_name}}, I just left a voicemail. I reviewed {{property}}, and a few condition details could move the value. Is the home mostly updated, mostly original, or somewhere between?",
    objections:[
      {label:"Zillow says more",response:"That may be possible. Automated estimates cannot see condition, upgrades, layout, or the exact competing homes. Let’s identify what Zillow may be missing before we accept or reject the number."},
      {label:"I only want a number",response:"I will give you a range. I just want the assumptions to be clear so the number helps you make a decision instead of creating false confidence."},
      {label:"Another agent priced it higher",response:"A higher number feels better, but the real question is what the market will support and what strategy protects your net. What evidence did they use?"}
    ]
  },
  {
    id:"script-future-seller",name:"Future seller check-in",category:"Future Seller",
    goal:"Reopen the relationship naturally and learn what changed without sounding like a pressure follow-up.",
    opener:"Hey {{first_name}}, it’s {{agent_name}} with Holton Homes. I had a note to check back in around now. How have things changed since we last talked about {{property}}?",
    questions:[
      "Is moving still something you would consider?",
      "What is the biggest thing holding the decision back?",
      "Has your ideal timing changed?",
      "Would seeing an updated value or net estimate help?",
      "Do you need to solve the next-home side before selling?"
    ],
    close:"Let’s update the numbers and the plan so you know what is realistic, even if the move is still months away.",
    voicemail:"Hi {{first_name}}, it’s {{agent_name}} with Holton Homes. I had a reminder to check back in about {{property}}. No pressure—I just wanted to see whether anything changed.",
    afterVoicemailText:"Hi {{first_name}}, I had a reminder to check back in about {{property}}. Is a move still on the radar, or has the plan changed?",
    objections:[
      {label:"Nothing has changed",response:"That is helpful to know. What is the one condition that would need to change before the move became worth revisiting?"},
      {label:"Maybe next year",response:"That gives us time to plan well. Which part should we solve first—repairs, value, buying next, or the timeline?"},
      {label:"Rates are too high",response:"Rates matter, but the right comparison is the full move: sale proceeds, next payment, taxes, and your reason for moving. We can model that before you decide."}
    ]
  },
  {
    id:"script-listing-appointment",name:"Listing appointment",category:"Listing Appointment",
    goal:"Confirm motivation and decision criteria, present the plan clearly, and ask directly for the listing.",
    opener:"Thanks for having me over, {{first_name}}. Before I show you pricing and marketing, I want to make sure I understand what a successful sale looks like for you.",
    questions:[
      "Why is moving important now?",
      "What matters most: timing, price, convenience, or certainty?",
      "What concerns you most about selling?",
      "How will you decide which agent to hire?",
      "Is everyone who needs to approve the decision here?"
    ],
    close:"You told me the priorities are clear pricing, strong marketing, and a smooth timeline. My recommendation is that we begin with the plan we reviewed. Are you comfortable moving forward with Holton Homes?",
    voicemail:"Hi {{first_name}}, it’s {{agent_name}} with Holton Homes confirming our appointment for {{property}}. I’ll bring the pricing range, market evidence, and a clear selling plan.",
    afterVoicemailText:"Hi {{first_name}}, confirming our appointment for {{property}}. I’ll bring the market evidence, pricing range, and selling plan. Will everyone involved in the decision be able to join us?",
    objections:[
      {label:"We want to interview others",response:"That is reasonable. Before I leave, what will you use to compare the agents? I want to make sure you have a clear standard—not just three different suggested prices."},
      {label:"Your price is too low",response:"I understand. My job is to separate the price we would like from the price buyers will support. Let’s look at which evidence you disagree with and whether a different strategy is defensible."},
      {label:"Commission is too high",response:"The important comparison is not just the fee—it is your net, the probability of closing, and the work required to protect the deal. Which part of the service feels least valuable to you?"},
      {label:"We need to think",response:"Of course. What specifically do you need to think through—the timing, price, agreement, or whether I am the right agent?"}
    ]
  },
  {
    id:"script-active-listing",name:"Active listing seller update",category:"Active Listing",
    goal:"Give the seller clarity, interpret market feedback, and agree on the next strategy.",
    opener:"Hey {{first_name}}, it’s {{agent_name}} with your weekly update on {{property}}. I want to cover activity, feedback, competition, and the decision I recommend next.",
    questions:[
      "How are you feeling about the activity so far?",
      "Has your timing or motivation changed?",
      "What feedback concerns you most?",
      "Are there any showing restrictions we should revisit?",
      "Are you comfortable with the next pricing or marketing adjustment?"
    ],
    close:"My recommendation is {{recommended_action}} because the current buyer response is telling us {{market_signal}}. Let’s agree on the next step today.",
    voicemail:"Hi {{first_name}}, it’s {{agent_name}} with your Holton Homes listing update. I have the latest activity, feedback, competition, and my recommended next step.",
    afterVoicemailText:"Hi {{first_name}}, I just left your listing update. I have new activity, feedback, and a recommendation for {{property}}. What time today works for a quick call?",
    objections:[
      {label:"We need more time",response:"We can give it more time, but let’s define what we expect to change and the date when we will reassess. Time alone does not improve the market response."},
      {label:"Do more marketing",response:"We should absolutely maximize exposure. The key question is whether buyers are not seeing the home or seeing it and rejecting the value. The data tells us which problem we have."},
      {label:"We will not reduce",response:"I respect that decision. Let’s document the tradeoff: likely longer market time, fewer urgent buyers, and the risk of chasing the market later."}
    ]
  },
  {
    id:"script-buyer",name:"Buyer discovery",category:"Buyer",
    goal:"Understand payment comfort, financing, timing, location, and the real reason for the move.",
    opener:"Hey {{first_name}}, this is {{agent_name}} with Holton Homes. I want to make the search useful instead of sending random listings. Can I ask a few quick questions about what you are trying to accomplish?",
    questions:[
      "What is creating the need or desire to move?",
      "What monthly payment feels comfortable?",
      "Have you spoken with a lender yet?",
      "Which areas are realistic for work and daily life?",
      "What are the three non-negotiables?",
      "When would you ideally be moved?"
    ],
    close:"The best next step is a buyer consultation so we can connect payment, financing, areas, and the search strategy. Let’s get that scheduled.",
    voicemail:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I’m following up about your home search. Call or text me at {{agent_phone}} and we’ll narrow the search around the payment and areas that actually work.",
    afterVoicemailText:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I just left a voicemail about your home search. What monthly payment and areas are you targeting?",
    objections:[
      {label:"We are just browsing",response:"That is fine. Browsing becomes more useful once the payment and area are clear. What would make you move from browsing to acting?"},
      {label:"We do not want a lender yet",response:"You do not have to commit to anything. A lender conversation simply turns price into a realistic monthly payment and shows whether anything needs attention early."},
      {label:"We are using Zillow",response:"Zillow is useful for browsing. I add the strategy: payment, offer strength, property risks, and what the listing does not tell you."}
    ]
  },
  {
    id:"script-past-client",name:"Past client relationship call",category:"Past Client",
    goal:"Strengthen the relationship, provide value, and create a natural referral opportunity without making the call transactional.",
    opener:"Hey {{first_name}}, it’s {{agent_name}}. You crossed my mind and I wanted to check in. How are you and the home doing?",
    questions:[
      "What do you enjoy most about the home now?",
      "Is there anything you wish you had known earlier?",
      "Have you made any updates?",
      "Do you want an updated value or neighborhood market snapshot?",
      "Is anyone around you talking about a move?"
    ],
    close:"I’m glad I checked in. I’ll send the market update we discussed, and please reach out anytime you or someone you care about needs honest real estate help.",
    voicemail:"Hey {{first_name}}, it’s {{agent_name}}. Nothing urgent—I was thinking about you and wanted to see how you and the home are doing.",
    afterVoicemailText:"Hey {{first_name}}, nothing urgent—I was thinking about you and wanted to see how you and the home are doing. Hope everything is going well.",
    objections:[
      {label:"We are not moving",response:"Good—I am not calling to push a move. I want to stay useful after closing too. Is there anything about the home or market you have been wondering about?"},
      {label:"No referrals right now",response:"No worries at all. I appreciate the relationship more than a forced referral. Just keep me in mind when a real need comes up."}
    ]
  },
  {
    id:"script-partner",name:"Referral partner call",category:"Partner",
    goal:"Build a mutually useful relationship and identify a specific next collaboration.",
    opener:"Hey {{first_name}}, it’s {{agent_name}} with Holton Homes. I wanted to learn more about your business and see whether there is a useful way for us to help each other’s clients.",
    questions:[
      "Who is your ideal client?",
      "Which areas or price points are strongest for you?",
      "What causes the most friction in your current transactions?",
      "How do you prefer referrals to be introduced?",
      "What would make an agent relationship genuinely useful to you?"
    ],
    close:"I have a clear idea of who I should send your way. Let’s stay specific and follow through when the right client appears.",
    voicemail:"Hi {{first_name}}, it’s {{agent_name}} with Holton Homes. I wanted to introduce myself and learn more about your business. Call or text me at {{agent_phone}}.",
    afterVoicemailText:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I just left a voicemail—I’d like to learn about your business and see where our clients may overlap.",
    objections:[
      {label:"We already have partners",response:"That makes sense. I am not asking you to replace anyone. I would rather understand where gaps still exist and earn trust on the right opportunity."},
      {label:"Send me your info",response:"Absolutely. Before I do, what type of opportunity would be most useful for you so I can make the introduction relevant?"}
    ]
  },
  {
    id:"script-general",name:"General relationship call",category:"General",
    goal:"Have a real conversation, learn what matters now, and leave with a clear next step.",
    opener:"Hey {{first_name}}, it’s {{agent_name}} with Holton Homes. Did I catch you at an okay time?",
    questions:[
      "What has changed since we last spoke?",
      "What is most important to you right now?",
      "Is there a real estate question I can help clarify?",
      "What would be a useful next step?",
      "When should I check back in?"
    ],
    close:"That helps a lot. I’ll take care of {{next_step}} and follow up on {{follow_up_day}}.",
    voicemail:"Hi {{first_name}}, it’s {{agent_name}} with Holton Homes. Nothing urgent—I wanted to check in. Call or text me at {{agent_phone}} when you have a minute.",
    afterVoicemailText:"Hi {{first_name}}, it’s {{agent_name}} with Holton Homes. Nothing urgent—I wanted to check in. How have you been?",
    objections:[
      {label:"Bad time",response:"No problem at all. Is later today or another day better?"},
      {label:"Not interested",response:"Understood. I do not want to be a nuisance. Should I close the loop completely, or is there a better time to reconnect?"}
    ]
  }
];

const CLOUD_CONFIG=window.HOLTON_CLOUD_CONFIG||{};
const cloudClient=window.supabase&&CLOUD_CONFIG.url&&CLOUD_CONFIG.publishableKey
  ? window.supabase.createClient(CLOUD_CONFIG.url,CLOUD_CONFIG.publishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    })
  : null;
const CLOUD_TABLE=CLOUD_CONFIG.table||"crm_state";
let cloudSession=null,cloudUser=null,cloudReady=false,cloudApplying=false,cloudSaving=false;
let cloudSaveTimer=null,cloudStatus="Sign in to sync",cloudSubscription=null,pendingCloudRow=null;
let cloudInitialized=false;
const defaultPlans = [
  {
    id:"seller-speed",name:"Seller Speed-to-Lead",category:"Seller",
    description:"A personal, appointment-focused sequence for a new homeowner inquiry.",
    pauseOnReply:true,goalStages:["Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"ss1",day:0,type:"Call",title:"Call the new seller within five minutes",body:"Learn motivation, property, timing, decision makers, and what prompted the inquiry."},
      {id:"ss2",day:0,type:"Text",title:"Send a personal introduction",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I saw your real estate inquiry and wanted to personally reach out. What has you thinking about a move?"},
      {id:"ss3",day:1,type:"Call",title:"Second seller call attempt",body:"Reference the first message and ask one simple timing question."},
      {id:"ss4",day:2,type:"Email",title:"Send the Holton Homes seller roadmap",subject:"A simple plan for selling {{property}}",body:"Hi {{first_name}},\n\nI put together a simple next-step plan for homeowners considering a sale. The first step is understanding your goals, timing, and the current market around {{property}}.\n\n— {{agent_name}}"},
      {id:"ss5",day:4,type:"Call",title:"Pricing and motivation check-in",body:"Ask what outcome would make selling worthwhile."},
      {id:"ss6",day:7,type:"Follow Up",title:"Book the listing consultation or move to nurture",body:"Confirm the next clear commitment."}
    ]
  },
  {
    id:"future-seller",name:"Future Seller — 90 Day",category:"Seller",
    description:"Useful seller touches for homeowners who are not ready yet.",
    pauseOnReply:true,goalStages:["Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"fs1",day:0,type:"Email",title:"Send seller planning guide",subject:"Planning ahead for your future sale",body:"Hi {{first_name}},\n\nHere is a simple planning checklist so you can prepare without rushing. I’ll keep an eye on {{property}} and the surrounding market.\n\n— {{agent_name}}"},
      {id:"fs2",day:14,type:"Call",title:"Confirm timing and motivation",body:"Ask what would need to happen before a move becomes realistic."},
      {id:"fs3",day:30,type:"Email",title:"Send a useful market update",subject:"What is changing around {{property}}",body:"Hi {{first_name}},\n\nA quick update on the market around {{property}} and what it may mean for your plans."},
      {id:"fs4",day:60,type:"Call",title:"Personal seller check-in",body:"Reconnect personally before discussing real estate."},
      {id:"fs5",day:90,type:"Follow Up",title:"Refresh the value and timing conversation",body:"Decide whether to book, continue nurture, or close the loop."}
    ]
  },
  {
    id:"listing-prep",name:"Listing Appointment Prep",category:"Seller",
    description:"Everything Jacob needs before and after a listing appointment.",
    pauseOnReply:false,goalStages:["Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"lp1",day:0,type:"Task",title:"Confirm appointment and all decision makers",body:"Verify address, time, attendees, motivation, and timing."},
      {id:"lp2",day:0,type:"Task",title:"Prepare CMA and pricing range",body:"Review active, pending, sold, and failed listings."},
      {id:"lp3",day:0,type:"Task",title:"Prepare seller net sheet and marketing plan",body:"Make the financial outcome simple and visual."},
      {id:"lp4",day:1,type:"Call",title:"Listing appointment follow-up",body:"Answer objections and ask directly for the listing."},
      {id:"lp5",day:2,type:"Email",title:"Send appointment recap",subject:"Your Holton Homes selling plan",body:"Hi {{first_name}},\n\nHere is the plan we discussed for {{property}}, including positioning, timing, and the next decision.\n\n— {{agent_name}}"}
    ]
  },
  {
    id:"active-listing",name:"Active Listing Care",category:"Seller",
    description:"A predictable seller communication rhythm from launch through contract.",
    pauseOnReply:false,goalStages:["Under Contract","Closed"],
    steps:[
      {id:"al1",day:0,type:"Task",title:"Verify listing launch checklist",body:"Photos, remarks, disclosures, showing instructions, signage, and syndication."},
      {id:"al2",day:2,type:"Call",title:"First seller activity update",body:"Share traffic, feedback, online attention, and next recommendation."},
      {id:"al3",day:7,type:"Email",title:"Weekly seller report",subject:"Weekly update for {{property}}",body:"Hi {{first_name}},\n\nHere is this week’s activity, buyer feedback, market competition, and my recommendation for {{property}}."},
      {id:"al4",day:8,type:"Task",title:"Review pricing and competition",body:"Compare new listings, pendings, reductions, and buyer feedback."},
      {id:"al5",day:14,type:"Call",title:"Seller strategy conversation",body:"Make a clear recommendation rather than only reporting statistics."}
    ]
  },
  {
    id:"buyer-speed",name:"Buyer Speed-to-Lead",category:"Buyer",
    description:"Move a new buyer toward financing and a consultation quickly.",
    pauseOnReply:true,goalStages:["Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract","Closed"],
    steps:[
      {id:"bs1",day:0,type:"Call",title:"Call the new buyer",body:"Learn desired payment, financing, area, timing, and decision makers."},
      {id:"bs2",day:0,type:"Text",title:"Send a personal buyer introduction",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I saw your home-search inquiry. What monthly payment and area would feel comfortable for you?"},
      {id:"bs3",day:1,type:"Call",title:"Second buyer call attempt",body:"Lead with monthly payment and financing clarity."},
      {id:"bs4",day:2,type:"Email",title:"Send buyer roadmap",subject:"Your simple home-buying plan",body:"Hi {{first_name}},\n\nThe fastest way to make this simple is to confirm payment, financing, and your must-haves before we tour homes.\n\n— {{agent_name}}"},
      {id:"bs5",day:5,type:"Follow Up",title:"Book the buyer consultation",body:"Set a specific appointment or move to nurture."}
    ]
  },
  {
    id:"open-house",name:"Open House Conversion",category:"Buyer",
    description:"Separate serious buyers, future sellers, neighbors, and referral opportunities.",
    pauseOnReply:true,goalStages:["Buyer Consultation","Listing Appointment","Pre-Approved","Touring Homes","Under Contract","Closed"],
    steps:[
      {id:"oh1",day:0,type:"Text",title:"Send open-house thank-you",body:"Hi {{first_name}}, thanks for stopping by today. What did you like most—and what would you change? — {{agent_name}}"},
      {id:"oh2",day:1,type:"Call",title:"Call for honest property feedback",body:"Identify buyer status, representation, financing, and possible home to sell."},
      {id:"oh3",day:3,type:"Email",title:"Send useful next options",subject:"A few next options after the open house",body:"Hi {{first_name}},\n\nBased on what you shared, here are the next options I would consider."},
      {id:"oh4",day:7,type:"Follow Up",title:"Book consultation or classify relationship",body:"Buyer, seller, neighbor, nurture, referral partner, or close out."}
    ]
  },
  {
    id:"contract-close",name:"Contract-to-Close Command Plan",category:"Transaction",
    description:"Real transaction tasks instead of forcing a separate transaction system.",
    pauseOnReply:false,goalStages:["Closed"],
    steps:[
      {id:"cc1",day:0,type:"Task",title:"Verify signed contract and critical dates",body:"Earnest money, inspections, financing, appraisal, title, possession, and closing."},
      {id:"cc2",day:1,type:"Task",title:"Confirm lender, title, and cooperating agent contacts",body:"Make sure every party has the contract and timeline."},
      {id:"cc3",day:3,type:"Call",title:"Client expectations call",body:"Explain the next milestone, risks, and what you need from them."},
      {id:"cc4",day:7,type:"Task",title:"Inspection and due-diligence checkpoint",body:"Track reports, responses, repairs, and deadlines."},
      {id:"cc5",day:14,type:"Task",title:"Appraisal and financing checkpoint",body:"Confirm appraisal status, underwriting, conditions, and clear-to-close path."},
      {id:"cc6",day:21,type:"Task",title:"Title and closing preparation",body:"Review title, settlement figures, utilities, insurance, and possession."},
      {id:"cc7",day:27,type:"Task",title:"Schedule final walkthrough",body:"Confirm property condition and agreed repairs."},
      {id:"cc8",day:30,type:"Call",title:"Closing-day client call",body:"Confirm logistics and celebrate the milestone."},
      {id:"cc9",day:31,type:"Set Stage",title:"Closed",body:"Closed"}
    ]
  },
  {
    id:"past-client",name:"Past Client Relationship",category:"Past Client",
    description:"Reviews, referrals, equity conversations, and human check-ins.",
    pauseOnReply:false,goalStages:[],
    steps:[
      {id:"pc1",day:0,type:"Text",title:"Send personal closing thank-you",body:"Hi {{first_name}}, thank you for trusting me. I’m grateful I got to help, and I’m still here after closing. — {{agent_name}}"},
      {id:"pc2",day:14,type:"Call",title:"Two-week move-in check",body:"Ask how the move and home are going."},
      {id:"pc3",day:30,type:"Follow Up",title:"Request a review",body:"Make the request personal and easy."},
      {id:"pc4",day:90,type:"Email",title:"Send equity and market check-in",subject:"A quick check on your home and market",body:"Hi {{first_name}},\n\nI wanted to share a quick market and equity check-in and see how everything is going."},
      {id:"pc5",day:180,type:"Call",title:"Relationship check-in",body:"Call as a person, not a campaign."},
      {id:"pc6",day:365,type:"Call",title:"Home anniversary call",body:"Celebrate and ask how the home is serving them."}
    ]
  },
  {
    id:"partner-welcome",name:"Referral Partner Welcome",category:"Partner",
    description:"Build a useful working relationship with Realtors and lenders.",
    pauseOnReply:true,goalStages:[],
    steps:[
      {id:"rp1",day:0,type:"Call",title:"Partner introduction call",body:"Learn service area, specialties, communication standards, and ideal referrals."},
      {id:"rp2",day:0,type:"Email",title:"Send Holton Homes partner introduction",subject:"Holton Homes referral partnership",body:"Hi {{first_name}},\n\nI would like to learn how you work, who you serve best, and where we may be able to help each other.\n\n— {{agent_name}}"},
      {id:"rp3",day:7,type:"Follow Up",title:"Define a concrete partner next step",body:"Coffee, lender program review, co-marketing idea, open house, or referral process."},
      {id:"rp4",day:30,type:"Call",title:"Partner relationship check-in",body:"Share something useful before asking for anything."}
    ]
  }
];

const defaultAutomationRules = [
  {
    id:"rule-new-seller",name:"New seller → speed-to-lead",description:"Starts the seller plan for a new seller record.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{type:"Seller",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"seller-speed"}]
  },
  {
    id:"rule-new-buyer",name:"New buyer → speed-to-lead",description:"Starts the buyer plan for a new buyer record.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{type:"Buyer",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"buyer-speed"}]
  },
  {
    id:"rule-high-intent",name:"High-intent behavior → call today",description:"Turns valuation, showing, repeated-view, and saved-property activity into a same-day response.",
    trigger:"Behavior",active:true,runMode:"changed",
    filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:"High Intent"},
    actions:[
      {type:"Set Heat",value:"Hot"},
      {type:"Add Tag",value:"High Intent"},
      {type:"Create Task",value:"Call high-intent lead today",extra:"Call"}
    ]
  },
  {
    id:"rule-listing-appointment",name:"Listing appointment → prep plan",description:"Prepares the CMA, net sheet, and follow-up automatically.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"Seller",stage:"Listing Appointment",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"listing-prep"}]
  },
  {
    id:"rule-active-listing",name:"Active listing → seller care",description:"Creates a predictable seller-update rhythm.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"Seller",stage:"Active Listing",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"active-listing"}]
  },
  {
    id:"rule-under-contract",name:"Under contract → closing command plan",description:"Creates transaction milestones without another app.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"",stage:"Under Contract",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"contract-close"}]
  },
  {
    id:"rule-stale-hot",name:"Hot lead silent 3 days → rescue",description:"Prevents a high-value relationship from disappearing.",
    trigger:"Stale",active:true,runMode:"daily",
    filters:{type:"",stage:"",heat:"Hot",source:"",tag:"",noContactDays:"3",minScore:"",behaviorType:""},
    actions:[
      {type:"Create Task",value:"Rescue hot lead: call today",extra:"Call"},
      {type:"Set Follow-Up",value:"0"}
    ]
  },
  {
    id:"rule-inbound-reply",name:"Inbound reply → stop automation and respond",description:"Pauses active plans and creates a human response task.",
    trigger:"Inbound Reply",active:true,runMode:"daily",
    filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[
      {type:"Pause Plans",value:""},
      {type:"Create Task",value:"Respond personally to inbound message",extra:"Follow Up"}
    ]
  },
  {
    id:"rule-partner",name:"New Realtor or lender → partner plan",description:"Builds a referral relationship without treating partners like leads.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{types:["Realtor","Lender"],type:"",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"partner-welcome"}]
  },
  {
    id:"rule-past-client",name:"Past client silent 90 days → relationship touch",description:"Protects referrals and repeat business.",
    trigger:"Stale",active:true,runMode:"monthly",
    filters:{type:"Past Client",stage:"",heat:"",source:"",tag:"",noContactDays:"90",minScore:"",behaviorType:""},
    actions:[{type:"Create Task",value:"Personal past-client check-in",extra:"Call"}]
  }
];

let db = null;
let state = {route:"today",smartList:"all",peopleQuery:"",peopleType:"",peopleStage:"",peopleHeat:"",inboxFolder:"open",activeThread:null,taskFilter:"open",pipelineType:"Seller",transactionFilter:"active",callIndex:0,workIndex:0,pendingTaskId:"",automationTab:"overview"};
let automationBusy=false,automationTimer=null;


function uid(){return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}
function esc(value){return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fullName(c){return [c.firstName,c.lastName].filter(Boolean).join(" ").trim() || c.name || "Unnamed Contact"}

function propertiesForContact(contactId){
  return (db.properties||[]).filter(p=>p.contactId===contactId)
}
function propertyAddress(p){
  if(!p)return "";
  const line=[p.street,p.unit].filter(Boolean).join(" ");
  const locality=[p.city,p.state,p.zip].filter(Boolean).join(" ");
  return [line,locality].filter(Boolean).join(", ")
}

function blankContactAddress(){
  return {type:"Home",street:"",unit:"",city:"",state:"OH",zip:"",county:"",sameAsPrimaryProperty:false}
}
function addressFromProperty(p,existing={}){
  if(!p)return {...blankContactAddress(),...existing};
  return {
    type:existing.type||"Home",street:p.street||"",unit:p.unit||"",city:p.city||"",
    state:p.state||"OH",zip:p.zip||"",county:p.county||"",
    sameAsPrimaryProperty:true
  }
}
function contactAddressObject(c){
  if(!c)return blankContactAddress();
  const stored={...blankContactAddress(),...(c.address||{})};
  if(stored.sameAsPrimaryProperty){
    const p=primaryProperty(c);
    if(p)return addressFromProperty(p,stored)
  }
  return stored
}
function formattedAddress(address){
  if(!address)return "";
  const line=[address.street,address.unit].filter(Boolean).join(" ");
  const locality=[address.city,address.state,address.zip].filter(Boolean).join(" ");
  return [line,locality].filter(Boolean).join(", ")
}
function contactAddressDisplay(c){return formattedAddress(contactAddressObject(c))}
function contactAddressComplete(c){
  const a=contactAddressObject(c);
  return Boolean(a.street&&a.city&&a.state&&a.zip)
}
function syncContactAddressFromPrimaryProperty(c){
  if(!c?.address?.sameAsPrimaryProperty)return;
  const p=primaryProperty(c);
  if(p)c.address=addressFromProperty(p,c.address)
}
function contactAddressPanelHtml(c){
  const a=contactAddressObject(c),display=formattedAddress(a);
  if(!display){
    return `<div class="contact-address-empty"><div><strong>No contact address saved.</strong><span>Add where this person lives or receives mail. This stays separate from the property opportunity.</span></div><button class="primary-btn compact" data-action="open-contact" data-id="${c.id}">＋ Add address</button></div>`
  }
  return `<div class="contact-address-panel">
    <div class="contact-address-icon">⌖</div>
    <div class="contact-address-copy"><span>${esc(a.type||"Home")} address${a.sameAsPrimaryProperty?" • synced to primary property":""}</span><strong>${esc(display)}</strong>${a.county?`<small>${esc(a.county)} County</small>`:""}</div>
    <div class="contact-address-actions">
      <a class="quick" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display)}">Map</a>
      <button class="quick" data-action="copy-contact-address" data-id="${c.id}">Copy</button>
      <button class="quick" data-action="open-contact" data-id="${c.id}">Edit</button>
    </div>
  </div>`
}
function fillContactAddressFromPrimaryProperty(){
  const contactId=document.getElementById("contactId")?.value||"";
  const c=contact(contactId);
  const p=c?primaryProperty(c):null;
  const values=p?{
    street:p.street||"",unit:p.unit||"",city:p.city||"",state:p.state||"OH",zip:p.zip||"",county:p.county||""
  }:{
    street:document.getElementById("sellerPropertyStreet")?.value||"",
    unit:document.getElementById("sellerPropertyUnit")?.value||"",
    city:document.getElementById("sellerPropertyCity")?.value||"",
    state:document.getElementById("sellerPropertyState")?.value||"OH",
    zip:document.getElementById("sellerPropertyZip")?.value||"",
    county:document.getElementById("sellerPropertyCounty")?.value||""
  };
  const mapping={contactAddressStreet:"street",contactAddressUnit:"unit",contactAddressCity:"city",contactAddressState:"state",contactAddressZip:"zip",contactAddressCounty:"county"};
  Object.entries(mapping).forEach(([id,key])=>{const input=document.getElementById(id);if(input)input.value=values[key]||""});
  const checkbox=document.getElementById("contactAddressSameAsProperty");if(checkbox)checkbox.checked=true;
  if(values.street||values.city)toast("Address copied","The contact address will stay synced to the primary property.");
  else toast("No property address yet","Enter the seller property below, then tap this again—or save with sync turned on.")
}

function primaryProperty(c){
  const items=propertiesForContact(c.id);
  return items.find(p=>p.primary)||items[0]||null
}
function propertyDisplay(c){
  const p=primaryProperty(c);
  return propertyAddress(p)||c.property||c.buyerDetails?.areas||c.sphereDetails?.neighborhood||""
}
function propertyEquity(p){
  return Math.max(0,Number(p?.estimatedValue||0)-Number(p?.mortgageBalance||0))
}
function ensureStructuredProperties(){
  db.properties=db.properties||[];
  db.contacts.forEach(c=>{
    if(propertiesForContact(c.id).length||!c.property||!["Seller","Past Client"].includes(c.type))return;
    db.properties.push({
      id:uid(),contactId:c.id,role:c.type==="Seller"?"Seller Property":"Past Client Home",
      status:c.stage==="Closed"?"Closed":"Prospect",primary:true,street:c.property,unit:"",city:"",
      state:"OH",zip:"",county:"",propertyType:"Single Family",beds:"",baths:"",sqft:"",acres:"",
      yearBuilt:"",occupancy:"Unknown",ownership:"Unknown",
      estimatedValue:Number(c.sellerDetails?.estimatedValue||0),
      mortgageBalance:Number(c.sellerDetails?.mortgageBalance||0),listPrice:0,expectedSalePrice:0,
      targetDate:"",appointmentDate:"",condition:c.sellerDetails?.condition||"",
      motivation:c.sellerDetails?.motivation||"",notes:"",createdAt:c.createdAt||TODAY(),updatedAt:TODAY()
    })
  })
}
function propertyFacts(p){
  return [
    p.propertyType,
    p.beds?`${p.beds} bd`:"",
    p.baths?`${p.baths} ba`:"",
    p.sqft?`${Number(p.sqft).toLocaleString()} sf`:"",
    p.acres?`${p.acres} ac`:"",
    p.yearBuilt?`Built ${p.yearBuilt}`:""
  ].filter(Boolean).join(" • ")
}
function propertyCardsHtml(c){
  const properties=propertiesForContact(c.id);
  if(!properties.length){
    return `<div class="property-empty"><div><strong>No structured property record yet.</strong><span>Add the address and property facts now so pricing, appointments, equity, and transaction plans stay connected.</span></div><button class="primary-btn compact" data-action="open-property" data-id="${c.id}">＋ Add property</button></div>`
  }
  return `<div class="property-cards">${properties.map(p=>{
    const address=propertyAddress(p)||"Address not completed",equity=propertyEquity(p);
    return `<article class="property-card ${p.primary?"primary":""}">
      <div class="property-card-head"><div><span>${esc(p.role)}</span><strong>${esc(address)}</strong><small>${esc(propertyFacts(p)||p.occupancy||"Property details incomplete")}</small></div><span class="badge ${["Active","Under Contract","Closed"].includes(p.status)?"good":"warn"}">${esc(p.status)}</span></div>
      <div class="property-money">
        <div><label>Est. value</label><b>${p.estimatedValue?money(p.estimatedValue):"Unknown"}</b></div>
        <div><label>Mortgage</label><b>${p.mortgageBalance?money(p.mortgageBalance):"Unknown"}</b></div>
        <div><label>Est. equity</label><b>${p.estimatedValue?money(equity):"Unknown"}</b></div>
      </div>
      <div class="property-meta">${p.motivation?`<span><b>Motivation:</b> ${esc(p.motivation)}</span>`:""}${p.targetDate?`<span><b>Target:</b> ${dateLabel(p.targetDate)}</span>`:""}${p.appointmentDate?`<span><b>Appointment:</b> ${dateLabel(p.appointmentDate)}</span>`:""}</div>
      <div class="property-actions">
        ${address!=="Address not completed"?`<a class="quick" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}">Map</a>`:""}
        <button class="quick" data-action="open-property" data-id="${c.id}" data-property="${p.id}">Edit</button>
        ${!p.primary?`<button class="quick" data-action="make-primary-property" data-id="${c.id}" data-property="${p.id}">Make primary</button>`:""}
        <button class="quick" data-action="delete-property" data-id="${c.id}" data-property="${p.id}">Remove</button>
      </div>
    </article>`
  }).join("")}<button class="ghost-btn compact full-width" data-action="open-property" data-id="${c.id}">＋ Add another property</button></div>`
}
function propertyModal(contactId,propertyId=""){
  const c=contact(contactId);if(!c)return;
  const p=(db.properties||[]).find(x=>x.id===propertyId)||{
    id:"",contactId,role:c.type==="Buyer"?"Buyer Interest":c.type==="Past Client"?"Past Client Home":"Seller Property",
    status:"Prospect",primary:propertiesForContact(contactId).length===0,street:"",unit:"",city:"",state:"OH",
    zip:"",county:"",propertyType:"Single Family",beds:"",baths:"",sqft:"",acres:"",yearBuilt:"",
    occupancy:"Unknown",ownership:"Unknown",estimatedValue:"",mortgageBalance:"",listPrice:"",
    expectedSalePrice:"",targetDate:"",appointmentDate:"",condition:"",motivation:"",notes:""
  };
  modal(p.id?`Edit ${propertyAddress(p)||"property"}`:"Add property or opportunity",`<div class="form-grid">
    <input type="hidden" id="propertyContactId" value="${esc(contactId)}">
    <input type="hidden" id="propertyId" value="${esc(p.id||"")}">
    <div class="field"><label>Role</label><select id="propertyRole">${["Seller Property","Buyer Interest","Past Client Home","Referral Property","Investment Property","Other"].map(x=>`<option ${p.role===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select id="propertyStatus">${["Prospect","Valuation","Listing Appointment","Coming Soon","Active","Under Contract","Closed","Not Moving"].map(x=>`<option ${p.status===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full section-label">Property address</div>
    <div class="field full"><label>Street address</label><input id="propertyStreet" value="${esc(p.street||"")}"></div>
    <div class="field"><label>Unit</label><input id="propertyUnit" value="${esc(p.unit||"")}"></div>
    <div class="field"><label>City</label><input id="propertyCity" value="${esc(p.city||"")}"></div>
    <div class="field"><label>State</label><input id="propertyState" value="${esc(p.state||"OH")}"></div>
    <div class="field"><label>ZIP</label><input id="propertyZip" value="${esc(p.zip||"")}"></div>
    <div class="field"><label>County</label><input id="propertyCounty" value="${esc(p.county||"")}"></div>
    <div class="field full section-label">Property facts</div>
    <div class="field"><label>Property type</label><select id="propertyType">${["Single Family","Farm","Acreage / Land","Condo","Townhome","Multi-Family","Manufactured","Commercial","Other"].map(x=>`<option ${p.propertyType===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Occupancy</label><select id="propertyOccupancy">${["Unknown","Owner Occupied","Tenant Occupied","Vacant","Second Home"].map(x=>`<option ${p.occupancy===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Ownership</label><select id="propertyOwnership">${["Unknown","Sole","Joint","Trust","Estate","LLC","Other"].map(x=>`<option ${p.ownership===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Beds</label><input id="propertyBeds" type="number" step=".5" value="${esc(p.beds||"")}"></div>
    <div class="field"><label>Baths</label><input id="propertyBaths" type="number" step=".5" value="${esc(p.baths||"")}"></div>
    <div class="field"><label>Square feet</label><input id="propertySqft" type="number" value="${esc(p.sqft||"")}"></div>
    <div class="field"><label>Acres</label><input id="propertyAcres" type="number" step=".01" value="${esc(p.acres||"")}"></div>
    <div class="field"><label>Year built</label><input id="propertyYear" type="number" value="${esc(p.yearBuilt||"")}"></div>
    <div class="field full section-label">Opportunity & money</div>
    <div class="field"><label>Estimated value</label><input id="propertyEstimatedValue" type="number" value="${esc(p.estimatedValue||"")}"></div>
    <div class="field"><label>Mortgage balance</label><input id="propertyMortgageBalance" type="number" value="${esc(p.mortgageBalance||"")}"></div>
    <div class="field"><label>List price</label><input id="propertyListPrice" type="number" value="${esc(p.listPrice||"")}"></div>
    <div class="field"><label>Expected sale price</label><input id="propertyExpectedSalePrice" type="number" value="${esc(p.expectedSalePrice||"")}"></div>
    <div class="field"><label>Target move/list date</label><input id="propertyTargetDate" type="date" value="${esc(p.targetDate||"")}"></div>
    <div class="field"><label>Listing/showing appointment</label><input id="propertyAppointmentDate" type="date" value="${esc(p.appointmentDate||"")}"></div>
    <div class="field full"><label>Condition</label><input id="propertyCondition" value="${esc(p.condition||"")}" placeholder="Updated, deferred maintenance, roof concern..."></div>
    <div class="field full"><label>Motivation</label><input id="propertyMotivation" value="${esc(p.motivation||"")}" placeholder="Downsizing, inherited property, relocation, more land..."></div>
    <div class="field full"><label>Property notes</label><textarea id="propertyNotes">${esc(p.notes||"")}</textarea></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-property">Save property</button>`)
}
function saveProperty(){
  const contactId=document.getElementById("propertyContactId").value,c=contact(contactId);
  if(!c)return;
  const id=document.getElementById("propertyId").value||uid(),old=(db.properties||[]).find(p=>p.id===id);
  const p={
    id,contactId,role:document.getElementById("propertyRole").value,status:document.getElementById("propertyStatus").value,
    primary:old?.primary??propertiesForContact(contactId).length===0,
    street:document.getElementById("propertyStreet").value.trim(),unit:document.getElementById("propertyUnit").value.trim(),
    city:document.getElementById("propertyCity").value.trim(),state:document.getElementById("propertyState").value.trim()||"OH",
    zip:document.getElementById("propertyZip").value.trim(),county:document.getElementById("propertyCounty").value.trim(),
    propertyType:document.getElementById("propertyType").value,beds:document.getElementById("propertyBeds").value,
    baths:document.getElementById("propertyBaths").value,sqft:document.getElementById("propertySqft").value,
    acres:document.getElementById("propertyAcres").value,yearBuilt:document.getElementById("propertyYear").value,
    occupancy:document.getElementById("propertyOccupancy").value,ownership:document.getElementById("propertyOwnership").value,
    estimatedValue:Number(document.getElementById("propertyEstimatedValue").value||0),
    mortgageBalance:Number(document.getElementById("propertyMortgageBalance").value||0),
    listPrice:Number(document.getElementById("propertyListPrice").value||0),
    expectedSalePrice:Number(document.getElementById("propertyExpectedSalePrice").value||0),
    targetDate:document.getElementById("propertyTargetDate").value,
    appointmentDate:document.getElementById("propertyAppointmentDate").value,
    condition:document.getElementById("propertyCondition").value.trim(),
    motivation:document.getElementById("propertyMotivation").value.trim(),
    notes:document.getElementById("propertyNotes").value.trim(),
    createdAt:old?.createdAt||TODAY(),updatedAt:TODAY()
  };
  const i=db.properties.findIndex(x=>x.id===id);if(i>=0)db.properties[i]=p;else db.properties.push(p);
  if(p.primary){
    db.properties.filter(x=>x.contactId===contactId&&x.id!==p.id).forEach(x=>x.primary=false);
    c.property=propertyAddress(p);
    if(c.type==="Seller"){
      c.sellerDetails={...c.sellerDetails,estimatedValue:p.estimatedValue||c.sellerDetails?.estimatedValue||"",mortgageBalance:p.mortgageBalance||c.sellerDetails?.mortgageBalance||"",condition:p.condition||c.sellerDetails?.condition||"",motivation:p.motivation||c.sellerDetails?.motivation||""}
    }
  }
  if(p.appointmentDate&&!db.tasks.some(t=>t.contactId===contactId&&t.type==="Appointment"&&t.due===p.appointmentDate&&t.status!=="Done")){
    db.tasks.unshift({id:uid(),contactId,title:`${p.role==="Seller Property"?"Listing":"Property"} appointment — ${propertyAddress(p)||fullName(c)}`,type:"Appointment",due:p.appointmentDate,status:"Open",priority:"High",planRunId:"",completedAt:"",createdAt:TODAY()})
  }
  syncContactAddressFromPrimaryProperty(c);c.updatedAt=TODAY();save();closeModal();toast("Property saved",propertyAddress(p)||p.role);renderContact(contactId)
}
function deleteProperty(contactId,propertyId){
  const c=contact(contactId),p=(db.properties||[]).find(x=>x.id===propertyId);if(!c||!p)return;
  if(!confirm(`Remove ${propertyAddress(p)||"this property"} from ${fullName(c)}?`))return;
  db.properties=db.properties.filter(x=>x.id!==propertyId);
  const remaining=propertiesForContact(contactId);
  if(p.primary&&remaining.length)remaining[0].primary=true;
  c.property=propertyDisplay(c);syncContactAddressFromPrimaryProperty(c);c.updatedAt=TODAY();save();toast("Property removed",propertyAddress(p));renderContact(contactId)
}
function makePrimaryProperty(contactId,propertyId){
  const c=contact(contactId),p=(db.properties||[]).find(x=>x.id===propertyId);if(!c||!p)return;
  db.properties.filter(x=>x.contactId===contactId).forEach(x=>x.primary=x.id===propertyId);
  c.property=propertyAddress(p);syncContactAddressFromPrimaryProperty(c);c.updatedAt=TODAY();save();toast("Primary property updated",propertyAddress(p));renderContact(contactId)
}
function leadIntakeItems(c){
  const p=primaryProperty(c),items=[
    {label:"Valid phone or email",done:hasPhone(c)||hasEmail(c)},
    {label:"Contact / mailing address",done:contactAddressComplete(c)},
    {label:"Lead source",done:Boolean(c.source&&c.source!=="Other")},
    {label:"Timeframe",done:Boolean(c.timeframe&&c.timeframe!=="Unknown")},
    {label:"Next follow-up",done:Boolean(c.followUp)},
    {label:"Decision makers / household",done:(c.household||[]).some(m=>m.decisionMaker)||Boolean(c.sellerDetails?.decisionMakers)}
  ];
  if(c.type==="Seller"){
    items.push(
      {label:"Full property address",done:Boolean(p?.street&&p?.city&&p?.zip)},
      {label:"Seller motivation",done:Boolean(p?.motivation||c.sellerDetails?.motivation)},
      {label:"Estimated value or pricing context",done:Boolean(p?.estimatedValue)},
      {label:"Mortgage / equity context",done:Boolean(p?.mortgageBalance)}
    )
  }else if(c.type==="Buyer"){
    items.push(
      {label:"Target areas",done:Boolean(c.buyerDetails?.areas||c.property)},
      {label:"Budget or desired payment",done:Boolean(c.buyerDetails?.budget||c.buyerDetails?.desiredPayment)},
      {label:"Preapproval / lender status",done:Boolean(c.buyerDetails?.preapproval&&c.buyerDetails.preapproval!=="Unknown")}
    )
  }else if(["Realtor","Lender"].includes(c.type)){
    items.push({label:"Company",done:Boolean(c.professionalDetails?.company)},{label:"Service area / specialty",done:Boolean(c.professionalDetails?.serviceArea||c.professionalDetails?.specialties)})
  }else{
    items.push({label:"Relationship context",done:Boolean(c.sphereDetails?.relationship)},{label:"Homeowner / neighborhood",done:Boolean(c.sphereDetails?.homeowner!=="Unknown"||c.sphereDetails?.neighborhood)})
  }
  return items
}
function leadIntakeHtml(c){
  const items=leadIntakeItems(c),done=items.filter(x=>x.done).length,pct=Math.round(done/items.length*100);
  return `<div class="intake-score"><div><strong>${pct}%</strong><span>lead record complete</span></div><div class="intake-track"><i style="width:${pct}%"></i></div></div>
    <div class="intake-checklist">${items.map(item=>`<div class="${item.done?"done":"missing"}"><span>${item.done?"✓":"!"}</span><b>${esc(item.label)}</b></div>`).join("")}</div>
    ${pct<100?`<button class="ghost-btn compact full-width" data-action="open-contact" data-id="${c.id}">Complete lead intake</button>`:""}`
}
function syncPrimaryPropertyFromSellerForm(c){
  if(c.type!=="Seller")return;
  const street=document.getElementById("sellerPropertyStreet")?.value.trim()||"";
  const city=document.getElementById("sellerPropertyCity")?.value.trim()||"";
  const state=document.getElementById("sellerPropertyState")?.value.trim()||"OH";
  const zip=document.getElementById("sellerPropertyZip")?.value.trim()||"";
  const county=document.getElementById("sellerPropertyCounty")?.value.trim()||"";
  if(!street&&!city&&!zip)return;
  const current=primaryProperty(c),id=current?.id||uid();
  const p={
    id,contactId:c.id,role:"Seller Property",status:current?.status||"Prospect",primary:true,
    street,unit:document.getElementById("sellerPropertyUnit")?.value.trim()||"",
    city,state,zip,county,propertyType:document.getElementById("sellerPropertyType")?.value||"Single Family",
    beds:document.getElementById("sellerPropertyBeds")?.value||"",baths:document.getElementById("sellerPropertyBaths")?.value||"",
    sqft:document.getElementById("sellerPropertySqft")?.value||"",acres:document.getElementById("sellerPropertyAcres")?.value||"",
    yearBuilt:document.getElementById("sellerPropertyYear")?.value||"",occupancy:document.getElementById("sellerPropertyOccupancy")?.value||"Unknown",
    ownership:document.getElementById("sellerPropertyOwnership")?.value||"Unknown",
    estimatedValue:Number(document.getElementById("sellerEstimatedValue")?.value||0),
    mortgageBalance:Number(document.getElementById("sellerMortgageBalance")?.value||0),
    listPrice:current?.listPrice||0,expectedSalePrice:current?.expectedSalePrice||0,
    targetDate:document.getElementById("sellerTargetDate")?.value||"",appointmentDate:document.getElementById("sellerAppointmentDate")?.value||"",
    condition:document.getElementById("sellerCondition")?.value.trim()||"",
    motivation:document.getElementById("sellerMotivation")?.value.trim()||"",notes:current?.notes||"",
    createdAt:current?.createdAt||TODAY(),updatedAt:TODAY()
  };
  const i=db.properties.findIndex(x=>x.id===id);if(i>=0)db.properties[i]=p;else db.properties.push(p);
  db.properties.filter(x=>x.contactId===c.id&&x.id!==id).forEach(x=>x.primary=false);
  c.property=propertyAddress(p);syncContactAddressFromPrimaryProperty(c)
}
function untouchedLeads(){
  return db.contacts.filter(c=>isOpen(c)&&["Seller","Buyer"].includes(c.type)&&!c.lastCommunication&&daysSince(c.createdAt)<=14)
    .sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))
}
function upcomingTasksByType(type,days=7){
  const end=addDays(TODAY(),days);
  return db.tasks.filter(t=>t.status!=="Done"&&t.type===type&&t.due>=TODAY()&&t.due<=end).sort((a,b)=>a.due.localeCompare(b.due))
}
function dailyLane(title,subtitle,items,kind){
  return `<section class="daily-lane"><div class="daily-lane-head"><div><h3>${esc(title)}</h3><span>${esc(subtitle)}</span></div><b>${items.length}</b></div>
    <div class="daily-lane-body">${items.length?items.slice(0,5).map(item=>{
      const c=item.contactId?contact(item.contactId):item;
      if(!c)return "";
      const detail=item.contactId?`${item.type} • ${dateLabel(item.due)}`:`${c.type} • ${c.stage}${c.followUp?` • ${dateLabel(c.followUp)}`:""}`;
      return `<div class="daily-lead-row">${avatar(c)}<div><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a><small>${esc(detail)}</small></div>${kind==="lead"?contactQuickActions(c):`<button class="quick" data-action="complete-task-button" data-id="${item.id}">Done</button>`}</div>`
    }).join(""):`<div class="lane-empty">Nothing due.</div>`}</div></section>`
}

function workItemSnoozed(item){
  const until=db.workSnoozes?.[item.id];
  return Boolean(until&&until>TODAY())
}
function addWorkItem(items,item){
  if(!item||workItemSnoozed(item))return;
  items.push({...item,priority:Number(item.priority||0)})
}
function workQueueItems(){
  const items=[];
  const open=db.contacts.filter(isOpen);

  const unreadByContact=new Map();
  db.communications.filter(m=>m.unread&&m.direction==="inbound").forEach(m=>{
    const current=unreadByContact.get(m.contactId);
    if(!current||String(m.date)>String(current.date))unreadByContact.set(m.contactId,m)
  });
  unreadByContact.forEach((message,contactId)=>{
    const c=contact(contactId);if(!c)return;
    addWorkItem(items,{id:`reply-${c.id}`,kind:"reply",contactId:c.id,title:`Reply to ${fullName(c)}`,reason:`Inbound ${message.channel.toLowerCase()} waiting since ${dateTimeLabel(message.date)}`,priority:110,due:String(message.date).slice(0,10),channel:message.channel})
  });

  untouchedLeads().forEach(c=>addWorkItem(items,{
    id:`untouched-${c.id}`,kind:"untouched",contactId:c.id,title:`Contact new ${c.type.toLowerCase()} lead`,
    reason:`No personal communication logged • added ${dateLabel(c.createdAt)}`,priority:100+(c.type==="Seller"?8:0)+(c.heat==="Hot"?6:0),due:c.createdAt,channel:hasPhone(c)?"Call":hasEmail(c)?"Email":"Note"
  }));

  db.tasks.filter(t=>t.status!=="Done"&&t.due<=TODAY()).forEach(t=>{
    const c=contact(t.contactId);
    addWorkItem(items,{id:`task-${t.id}`,kind:"task",taskId:t.id,contactId:c?.id||"",title:t.title,
      reason:`${t.type} ${t.due<TODAY()?`overdue since ${dateLabel(t.due)}`:"due today"}${c?` • ${fullName(c)}`:""}`,
      priority:95+(t.priority==="High"?8:0)+(t.due<TODAY()?6:0),due:t.due,channel:t.type==="Call"?"Call":t.type==="Text"?"Text":t.type==="Email"?"Email":"Note"
    })
  });

  const taskContacts=new Set(items.filter(x=>x.taskId).map(x=>x.contactId));
  dueContacts().filter(c=>!taskContacts.has(c.id)).forEach(c=>addWorkItem(items,{
    id:`followup-${c.id}`,kind:"followup",contactId:c.id,title:`Follow up with ${fullName(c)}`,
    reason:`Next follow-up ${c.followUp<TODAY()?`was due ${dateLabel(c.followUp)}`:"is due today"} • ${c.type} • ${c.stage}`,
    priority:88+(c.type==="Seller"?7:0)+(c.heat==="Hot"?8:0),due:c.followUp,channel:hasPhone(c)?"Call":hasEmail(c)?"Email":"Note"
  }));

  db.tasks.filter(t=>t.status!=="Done"&&["Appointment","Transaction"].includes(t.type)&&t.due>TODAY()&&t.due<=addDays(TODAY(),7)).forEach(t=>{
    const c=contact(t.contactId);
    addWorkItem(items,{id:`upcoming-${t.id}`,kind:t.type==="Appointment"?"appointment":"deadline",taskId:t.id,contactId:c?.id||"",title:t.title,
      reason:`${t.type==="Appointment"?"Appointment":"Transaction deadline"} • ${dateLabel(t.due)}${c?` • ${fullName(c)}`:""}`,
      priority:t.type==="Appointment"?78:82,due:t.due,channel:"Note"
    })
  });

  open.filter(c=>c.type==="Seller"&&c.stage==="Active Listing"&&daysSince(c.lastCommunication)>=7).forEach(c=>addWorkItem(items,{
    id:`seller-update-${c.id}`,kind:"seller-update",contactId:c.id,title:`Update active seller — ${fullName(c)}`,
    reason:`No seller update logged in ${daysSince(c.lastCommunication)} days • ${propertyDisplay(c)||"active listing"}`,
    priority:86,due:TODAY(),channel:hasPhone(c)?"Call":"Email"
  }));

  open.filter(c=>c.heat==="Hot"&&daysSince(c.lastCommunication)>=3&&!items.some(x=>x.contactId===c.id)).forEach(c=>addWorkItem(items,{
    id:`stale-hot-${c.id}`,kind:"stale-hot",contactId:c.id,title:`Rescue hot lead — ${fullName(c)}`,
    reason:`Hot ${c.type.toLowerCase()} with no personal communication in ${daysSince(c.lastCommunication)} days`,
    priority:80+(c.type==="Seller"?5:0),due:TODAY(),channel:hasPhone(c)?"Call":"Email"
  }));

  open.filter(c=>["Seller","Buyer"].includes(c.type)&&!c.followUp&&!items.some(x=>x.contactId===c.id)).forEach(c=>addWorkItem(items,{
    id:`missing-next-${c.id}`,kind:"missing-next",contactId:c.id,title:`Set the next step for ${fullName(c)}`,
    reason:`Open ${c.type.toLowerCase()} has no next follow-up`,priority:72+(c.type==="Seller"?4:0),due:TODAY(),channel:"Note"
  }));

  transactionDeadlineItems().forEach(({tx,c,step})=>addWorkItem(items,{
    id:`transaction-${tx.id}-${step.id}`,kind:"transaction-step",contactId:c?.id||"",transactionId:tx.id,stepId:step.id,
    title:step.title,reason:`${step.status==="Problem"?"PROBLEM":step.due<TODAY()?"Overdue":step.due===TODAY()?"Due today":"Transaction step"} • ${transactionAddress(tx)||"address needed"} • ${tx.side} side`,
    priority:step.status==="Problem"?125:step.due<TODAY()?118:106,due:step.due||TODAY(),channel:"Note"
  }));
  const sorted=items.sort((a,b)=>b.priority-a.priority||String(a.due).localeCompare(String(b.due)));
  const seen=new Set();
  return sorted.filter(item=>{
    if(["appointment","deadline"].includes(item.kind))return true;
    if(!item.contactId)return true;
    if(seen.has(item.contactId))return false;
    seen.add(item.contactId);return true
  })
}
function workQueueStats(){
  const items=workQueueItems();
  return {
    total:items.length,
    replies:items.filter(x=>x.kind==="reply").length,
    overdue:items.filter(x=>x.reason.includes("overdue")||x.reason.includes("was due")).length,
    sellers:items.filter(x=>contact(x.contactId)?.type==="Seller").length
  }
}
function workIcon(item){
  return item.kind==="reply"?"↩":item.kind==="untouched"?"★":item.kind==="task"?"✓":item.kind==="appointment"?"◆":item.kind==="deadline"?"!":item.kind==="seller-update"?"⌂":item.kind==="missing-next"?"＋":"☎"
}
function workPrimaryLabel(item){
  if(item.kind==="reply")return "Open reply";
  if(item.kind==="transaction-step")return "Open deal";
  if(item.kind==="missing-next")return "Set date";
  if(["task","appointment","deadline"].includes(item.kind))return "Complete";
  return item.channel==="Call"?"Call":item.channel==="Email"?"Email":"Log touch"
}
function workQueueRow(item,index){
  const c=contact(item.contactId);
  const canText=c&&hasPhone(c),canCall=c&&hasPhone(c);
  return `<article class="work-row">
    <div class="work-priority">${workIcon(item)}</div>
    <div class="work-copy">
      <strong>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(item.title)}</a>`:esc(item.title)}</strong>
      <small>${esc(item.reason)}</small>
      ${c?`<span>${esc(c.type)} • ${esc(c.stage)} • ${esc(c.heat)}</span>`:""}
    </div>
    <div class="work-actions">
      ${canCall&&!["task","appointment","deadline","reply","missing-next"].includes(item.kind)?`<button class="quick call" data-action="work-launch" data-id="${item.id}" data-channel="Call">☎</button>`:""}
      ${canText&&!["task","appointment","deadline","reply","missing-next"].includes(item.kind)?`<button class="quick text" data-action="work-launch" data-id="${item.id}" data-channel="Text">✉</button>`:""}
      ${c?`<button class="quick script" data-action="show-script" data-id="${c.id}" data-context="today" data-work="${item.id}">▤</button>`:""}
      <button class="primary-btn compact" data-action="work-primary" data-id="${item.id}">${workPrimaryLabel(item)}</button>
      <button class="quick" data-action="work-snooze" data-id="${item.id}" title="Snooze">⋯</button>
    </div>
  </article>`
}
function workQueueHtml(){
  const items=workQueueItems(),stats=workQueueStats();
  return `<section class="work-queue card">
    <div class="work-queue-head">
      <div><div class="eyebrow">WORK TODAY</div><h2>${items.length?`${items.length} item${items.length===1?"":"s"} need attention`:"You are caught up"}</h2><p>Replies first, then new leads, promises, deadlines, and seller care.</p></div>
      <div class="work-stat-pills"><span>${stats.replies} replies</span><span>${stats.overdue} overdue</span><span>${stats.sellers} seller items</span></div>
    </div>
    <div class="work-queue-list">${items.length?items.slice(0,12).map(workQueueRow).join(""):`<div class="work-clear"><strong>Nothing urgent is waiting.</strong><span>Add a seller conversation or review your pipeline.</span></div>`}</div>
    ${items.length>12?`<div class="work-more">Showing 12 of ${items.length}. Complete or snooze items to keep moving.</div>`:""}
  </section>`
}
function findWorkItem(id){return workQueueItems().find(item=>item.id===id)}
function workSnoozeModal(id){
  const item=findWorkItem(id);if(!item)return;
  modal("Snooze work item",`<div class="snooze-options">
    <p>${esc(item.title)}</p>
    <button class="snooze-choice" data-action="save-work-snooze" data-id="${id}" data-days="1">Tomorrow</button>
    <button class="snooze-choice" data-action="save-work-snooze" data-id="${id}" data-days="3">In 3 days</button>
    <button class="snooze-choice" data-action="save-work-snooze" data-id="${id}" data-days="7">In 1 week</button>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>`)
}
function saveWorkSnooze(id,days){
  db.workSnoozes[id]=addDays(TODAY(),Number(days||1));
  db.workHistory.unshift({id:uid(),itemId:id,action:"Snoozed",date:NOW(),until:db.workSnoozes[id]});
  db.workHistory=db.workHistory.slice(0,500);
  save();closeModal();route();toast("Snoozed",`This item returns ${dateLabel(db.workSnoozes[id])}.`)
}
function completeWorkItem(item){
  if(!item)return;
  if(item.taskId){
    const t=task(item.taskId);if(t){t.status="Done";t.completedAt=TODAY()}
  }
  if(item.kind==="reply")db.communications.filter(m=>m.contactId===item.contactId).forEach(m=>m.unread=false);
  db.workHistory.unshift({id:uid(),itemId:item.id,contactId:item.contactId||"",taskId:item.taskId||"",action:"Completed",date:NOW()});
  db.workHistory=db.workHistory.slice(0,500);
  delete db.workSnoozes[item.id];
  save();route();toast("Work item completed",item.title)
}
function launchWorkItem(id,channel=""){
  const item=findWorkItem(id);if(!item)return;
  const c=contact(item.contactId);
  if(item.kind==="transaction-step"){location.hash=`#/transaction/${item.transactionId}`;return}
  if(item.kind==="reply"){state.activeThread=item.contactId;location.hash="#/inbox";setTimeout(renderInbox,0);return}
  if(item.kind==="missing-next"){rescheduleModal(item.contactId);return}
  if(item.taskId&&["task","appointment","deadline"].includes(item.kind)){completeWorkItem(item);return}
  if(!c)return;
  const chosen=channel||item.channel||"Note";
  if(["Call","Text","Email"].includes(chosen)){
    savePendingTouch({contactId:c.id,channel:chosen,startedAt:NOW(),workItemId:item.id,returnRoute:"#/today"});
    if(chosen==="Call")location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`;
    if(chosen==="Text")location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}`;
    if(chosen==="Email")location.href=`mailto:${c.email}?subject=${encodeURIComponent("Holton Homes follow-up")}`;
    setTimeout(()=>showPendingTouchPrompt(),900)
  }else communicationModal(c.id,"Note")
}

function renderTagChips(tags=[],contactId=""){
  if(!tags.length)return `<span class="tag-empty">No tags</span>`;
  return `<div class="tag-chips">${tags.map(tag=>`<button class="tag-chip" data-action="filter-tag" data-tag="${esc(tag)}" title="Show everyone tagged ${esc(tag)}"><span>${esc(tag)}</span>${contactId?`<b data-action="remove-tag" data-id="${contactId}" data-tag="${esc(tag)}" title="Remove tag">×</b>`:""}</button>`).join("")}</div>`
}
function normalizeTag(value){return String(value||"").trim().replace(/^#+/,"").replace(/\s+/g," ")}
function addTagToContact(id,tag){
  const c=contact(id),clean=normalizeTag(tag);
  if(!c||!clean)return false;
  if(!c.tags.some(existing=>existing.toLowerCase()===clean.toLowerCase()))c.tags.push(clean);
  c.updatedAt=TODAY();save();return true
}

function initials(c){return `${(c.firstName||c.name||"?").trim()[0]||"?"}${(c.lastName||"").trim()[0]||""}`.toUpperCase()}
function money(value){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(value)||0)}
function dateLabel(value){if(!value)return "Not set";const d=new Date(`${value}T12:00:00`);return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined})}
function dateTimeLabel(value){if(!value)return "";const d=new Date(value);return d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
function addDays(base,days){const d=new Date(`${base||TODAY()}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
function daysSince(value){if(!value)return 999;return Math.max(0,Math.floor((new Date(`${TODAY()}T12:00:00`)-new Date(`${value.slice(0,10)}T12:00:00`))/86400000))}
function isOpen(c){return !["Closed","Lost"].includes(c.stage)}
function contact(id){return db.contacts.find(c=>c.id===id)}
function task(id){return db.tasks.find(t=>t.id===id)}
function hasPhone(c){return Boolean((c?.phone||"").replace(/\D/g,""))}
function hasEmail(c){return Boolean(c?.email && c.email.includes("@"))}


const transactionStepStatuses=["Not Started","In Progress","Waiting","Problem","Done","Skipped"];
const transactionOwners=["Agent","Client","Lender","Title","Inspector","Appraiser","Other"];
const transactionPhases=["Contract & Handoff","Inspection & Due Diligence","Financing & Appraisal","Title & Closing Prep","Final Walkthrough & Closing","Post-Closing"];

const buyerTransactionSteps=[
  {key:"signed-contract",phase:"Contract & Handoff",title:"Verify the fully signed contract is complete",description:"Confirm all signatures, initials, addenda, agency documents, and copies required by the brokerage file.",owner:"Agent",dateField:"contractDate",required:true},
  {key:"deliver-contract",phase:"Contract & Handoff",title:"Send the contract to lender and title company",description:"Deliver the ratified contract and confirm both parties opened the file.",owner:"Agent",base:"contractDate",offset:0,required:true},
  {key:"earnest-money",phase:"Contract & Handoff",title:"Confirm earnest money was delivered",description:"Track the exact contract deadline, amount, holder, and receipt. Do not guess the deadline.",owner:"Client",dateField:"earnestMoneyDue",required:true},
  {key:"loan-application",phase:"Contract & Handoff",title:"Confirm full loan application and lender documents",description:"Buyer submits requested income, asset, identification, and financing documents.",owner:"Client",dateField:"financingApplicationDue",required:true},
  {key:"open-title",phase:"Contract & Handoff",title:"Confirm title / escrow file is open",description:"Verify title contact, file number, and communication expectations.",owner:"Title",base:"contractDate",offset:1,required:true},

  {key:"schedule-inspection",phase:"Inspection & Due Diligence",title:"Schedule the home inspection immediately",description:"Leave enough time for the inspection report, specialists, negotiation, and written response.",owner:"Client",base:"contractDate",offset:1,required:true},
  {key:"inspection-complete",phase:"Inspection & Due Diligence",title:"Complete home inspection",description:"Confirm buyer attendance, access instructions, utilities, and report delivery.",owner:"Inspector",dateField:"inspectionDeadline",required:true},
  {key:"specialist-inspections",phase:"Inspection & Due Diligence",title:"Complete any specialist inspections",description:"Examples may include sewer scope, septic, well, radon, structural, chimney, pest, or environmental reviews when applicable.",owner:"Client",dateField:"inspectionDeadline",required:false},
  {key:"inspection-response",phase:"Inspection & Due Diligence",title:"Submit the inspection response before the deadline",description:"Document the buyer decision exactly as permitted by the contract and brokerage forms.",owner:"Agent",dateField:"inspectionResponseDeadline",required:true},
  {key:"repair-agreement",phase:"Inspection & Due Diligence",title:"Obtain the fully executed repair / credit agreement",description:"Confirm every negotiated repair, credit, price change, or termination document is signed and delivered.",owner:"Agent",dateField:"inspectionResponseDeadline",required:true},

  {key:"insurance",phase:"Financing & Appraisal",title:"Bind homeowner insurance",description:"Buyer selects coverage that satisfies lender requirements and provides evidence before closing.",owner:"Client",base:"closingDate",offset:-14,required:true},
  {key:"appraisal-ordered",phase:"Financing & Appraisal",title:"Confirm appraisal was ordered",description:"Monitor lender ordering and appraiser access without attempting to influence value.",owner:"Lender",base:"contractDate",offset:2,required:true},
  {key:"appraisal-complete",phase:"Financing & Appraisal",title:"Confirm appraisal is complete and received",description:"Track value, required repairs, and any reconsideration or amendment needed.",owner:"Lender",dateField:"appraisalDeadline",required:true},
  {key:"appraisal-resolution",phase:"Financing & Appraisal",title:"Resolve appraisal or lender-required repairs",description:"Document any price, credit, repair, or financing resolution in writing.",owner:"Agent",dateField:"appraisalDeadline",required:false},
  {key:"loan-commitment",phase:"Financing & Appraisal",title:"Confirm financing commitment / clear-to-close progress",description:"Get a direct lender update and identify outstanding underwriting conditions.",owner:"Lender",dateField:"loanCommitmentDeadline",required:true},

  {key:"title-commitment",phase:"Title & Closing Prep",title:"Review title commitment and exceptions",description:"Confirm the buyer receives title information and any title issue is escalated to the proper professional.",owner:"Title",dateField:"titleDeadline",required:true},
  {key:"survey-title-insurance",phase:"Title & Closing Prep",title:"Confirm survey and owner’s title-insurance decisions",description:"Track selections required by the contract, lender, or buyer.",owner:"Client",dateField:"titleDeadline",required:false},
  {key:"closing-disclosure",phase:"Title & Closing Prep",title:"Confirm buyer received and reviewed the Closing Disclosure",description:"For most financed purchases, the buyer must receive the Closing Disclosure at least three business days before closing. Enter the lender-confirmed delivery date.",owner:"Lender",dateField:"closingDisclosureDue",required:true},
  {key:"cash-to-close",phase:"Title & Closing Prep",title:"Confirm cash to close and independently verify wire instructions",description:"Buyer confirms final funds, acceptable payment method, and wire instructions using a known trusted phone number—not an unexpected email.",owner:"Client",base:"closingDate",offset:-2,required:true},
  {key:"utilities-address",phase:"Title & Closing Prep",title:"Arrange utilities, insurance start, and address changes",description:"Coordinate service transfers for the possession date.",owner:"Client",base:"possessionDate",offset:-2,required:false},

  {key:"repairs-verified",phase:"Final Walkthrough & Closing",title:"Verify agreed repairs and receipts",description:"Confirm work promised in the contract or amendment is complete before the final walkthrough.",owner:"Agent",dateField:"repairCompletionDate",required:true},
  {key:"final-walkthrough",phase:"Final Walkthrough & Closing",title:"Complete final walkthrough",description:"Verify condition, agreed repairs, included items, vacancy, and possession expectations.",owner:"Agent",dateField:"finalWalkthroughDate",required:true},
  {key:"closing-prep",phase:"Final Walkthrough & Closing",title:"Confirm closing appointment, identification, and final instructions",description:"Buyer knows when, where, how to sign, and what verified funds or identification are required.",owner:"Agent",base:"closingDate",offset:-1,required:true},
  {key:"closing-signing",phase:"Final Walkthrough & Closing",title:"Buyer signs closing documents",description:"Confirm questions are directed to the lender, title company, attorney, or other proper professional.",owner:"Client",dateField:"closingDate",required:true},
  {key:"funding-recording",phase:"Final Walkthrough & Closing",title:"Confirm funding and deed recording",description:"Do not promise keys or possession until the applicable funding, recording, and contract requirements are satisfied.",owner:"Title",dateField:"closingDate",required:true},
  {key:"keys-possession",phase:"Final Walkthrough & Closing",title:"Deliver keys and possession as agreed",description:"Track the exact possession date and any post-closing occupancy terms.",owner:"Agent",dateField:"possessionDate",required:true},

  {key:"closing-docs",phase:"Post-Closing",title:"Send and securely store the closing package",description:"Confirm the client has final documents and the brokerage file contains required records.",owner:"Agent",base:"closingDate",offset:1,required:true},
  {key:"seven-day-check",phase:"Post-Closing",title:"Complete the 7-day client check-in",description:"Confirm the move, utilities, keys, and immediate ownership questions are settled.",owner:"Agent",base:"closingDate",offset:7,required:false},
  {key:"thirty-day-check",phase:"Post-Closing",title:"Complete the 30-day relationship follow-up",description:"Provide value, request an honest review when appropriate, and remain available after closing.",owner:"Agent",base:"closingDate",offset:30,required:false}
];

const sellerTransactionSteps=[
  {key:"signed-contract",phase:"Contract & Handoff",title:"Verify the fully signed contract is complete",description:"Confirm signatures, initials, addenda, disclosures, agency forms, and copies required by the brokerage file.",owner:"Agent",dateField:"contractDate",required:true},
  {key:"deliver-contract",phase:"Contract & Handoff",title:"Send the contract to title and the buyer’s lender",description:"Confirm both files are open and all parties have current contact information.",owner:"Agent",base:"contractDate",offset:0,required:true},
  {key:"earnest-money",phase:"Contract & Handoff",title:"Confirm earnest money receipt status",description:"Track receipt through the proper holder in accordance with the purchase contract and brokerage procedure.",owner:"Agent",dateField:"earnestMoneyDue",required:true},
  {key:"seller-title-package",phase:"Contract & Handoff",title:"Collect seller payoff, marital, trust, estate, HOA, and title information",description:"Send requested seller information securely to the title company.",owner:"Client",base:"contractDate",offset:2,required:true},
  {key:"contract-summary",phase:"Contract & Handoff",title:"Send the seller a plain-language transaction summary",description:"Review price, concessions, contingencies, critical dates, closing, possession, and what happens next.",owner:"Agent",base:"contractDate",offset:1,required:true},

  {key:"inspection-access",phase:"Inspection & Due Diligence",title:"Coordinate inspection access",description:"Confirm access, utilities, pets, security, and seller preparation without interfering with the inspector.",owner:"Agent",dateField:"inspectionDeadline",required:true},
  {key:"inspection-response",phase:"Inspection & Due Diligence",title:"Review the buyer’s inspection response",description:"Explain the business choices while using proper forms and escalating legal or technical questions.",owner:"Agent",dateField:"inspectionResponseDeadline",required:true},
  {key:"repair-agreement",phase:"Inspection & Due Diligence",title:"Obtain the fully executed repair / credit agreement",description:"Confirm every repair, credit, price change, or other resolution is written and signed.",owner:"Agent",dateField:"inspectionResponseDeadline",required:true},
  {key:"repair-work",phase:"Inspection & Due Diligence",title:"Track repairs, invoices, permits, and receipts",description:"Monitor completion and retain evidence required by the agreement.",owner:"Client",dateField:"repairCompletionDate",required:true},

  {key:"appraisal-access",phase:"Financing & Appraisal",title:"Coordinate appraiser access and property readiness",description:"Provide lawful access and factual property information without pressuring the appraiser.",owner:"Agent",dateField:"appraisalDeadline",required:true},
  {key:"appraisal-result",phase:"Financing & Appraisal",title:"Confirm appraisal status and resolve required issues",description:"Track value, lender-required repairs, or written amendments when applicable.",owner:"Agent",dateField:"appraisalDeadline",required:true},
  {key:"loan-status",phase:"Financing & Appraisal",title:"Obtain a direct buyer-loan status update",description:"Monitor financing progress and unresolved conditions without requesting protected financial details.",owner:"Lender",dateField:"loanCommitmentDeadline",required:true},

  {key:"title-clearance",phase:"Title & Closing Prep",title:"Resolve title, lien, payoff, probate, trust, or HOA requirements",description:"Track title-company requirements and refer legal questions to the appropriate professional.",owner:"Title",dateField:"titleDeadline",required:true},
  {key:"deed-payoff",phase:"Title & Closing Prep",title:"Confirm deed, payoff, HOA, and seller identity documents",description:"Verify title has everything required to prepare closing.",owner:"Client",base:"closingDate",offset:-7,required:true},
  {key:"seller-closing-statement",phase:"Title & Closing Prep",title:"Review the seller closing statement and estimated net",description:"Verify price, payoffs, taxes, credits, commissions, fees, and proceeds with title before signing.",owner:"Agent",base:"closingDate",offset:-3,required:true},
  {key:"proceeds-security",phase:"Title & Closing Prep",title:"Independently verify seller proceeds instructions",description:"Use known contact information to confirm any wire or proceeds instructions and warn the seller about impersonation scams.",owner:"Client",base:"closingDate",offset:-3,required:true},
  {key:"move-possession",phase:"Title & Closing Prep",title:"Confirm moving, utilities, occupancy, and possession plan",description:"Seller understands when the property must be vacant, clean, and delivered under the contract.",owner:"Client",base:"possessionDate",offset:-3,required:true},

  {key:"repair-completion",phase:"Final Walkthrough & Closing",title:"Confirm repairs and receipts are complete",description:"Verify agreed work is complete before the buyer’s final walkthrough.",owner:"Agent",dateField:"repairCompletionDate",required:true},
  {key:"property-delivery",phase:"Final Walkthrough & Closing",title:"Prepare property for final walkthrough and delivery",description:"Clean the property, remove excluded belongings, leave included items, and gather keys, codes, remotes, warranties, and receipts.",owner:"Client",base:"closingDate",offset:-1,required:true},
  {key:"final-walkthrough",phase:"Final Walkthrough & Closing",title:"Confirm buyer final walkthrough result",description:"Address any last-minute condition or repair issue using proper written instructions.",owner:"Agent",dateField:"finalWalkthroughDate",required:true},
  {key:"seller-signing",phase:"Final Walkthrough & Closing",title:"Seller completes closing signatures",description:"Confirm signing time, location or remote arrangement, identification, and title instructions.",owner:"Client",dateField:"closingDate",required:true},
  {key:"funding-recording",phase:"Final Walkthrough & Closing",title:"Confirm funding, recording, and authorized possession",description:"Do not release keys or possession before the applicable closing requirements are satisfied.",owner:"Title",dateField:"closingDate",required:true},
  {key:"keys-possession",phase:"Final Walkthrough & Closing",title:"Transfer keys and possession as agreed",description:"Track exact possession terms, including any post-closing occupancy.",owner:"Agent",dateField:"possessionDate",required:true},

  {key:"proceeds-confirmed",phase:"Post-Closing",title:"Confirm seller proceeds were received",description:"Have the seller contact title directly if expected funds are delayed or incorrect.",owner:"Agent",base:"closingDate",offset:1,required:true},
  {key:"closed-file",phase:"Post-Closing",title:"Complete the brokerage closed file and commission check",description:"Confirm final documents, accounting, commission, referral obligations, and required transaction records.",owner:"Agent",base:"closingDate",offset:1,required:true},
  {key:"seven-day-check",phase:"Post-Closing",title:"Complete the 7-day seller check-in",description:"Confirm the move, possession, proceeds, and remaining questions are settled.",owner:"Agent",base:"closingDate",offset:7,required:false},
  {key:"thirty-day-check",phase:"Post-Closing",title:"Complete the 30-day relationship follow-up",description:"Provide continued value and request a review or introduction when appropriate.",owner:"Agent",base:"closingDate",offset:30,required:false}
];


const defaultTransactionResources = [
  {id:"ohio-buyer-guide",name:"Ohio REALTORS — Buyer transaction steps",category:"Official Guidance",url:"https://www.ohiorealtors.org/consumers-home-buying-steps/",official:true,notes:"Ohio transaction overview: contract, earnest money, title, inspections, financing, insurance, closing, and recording."},
  {id:"ohio-seller-guide",name:"Ohio REALTORS — Selling and closing",category:"Official Guidance",url:"https://www.ohiorealtors.org/consumers-selling-your-home/",official:true,notes:"Seller overview including offers, inspection negotiation, final walkthrough preparation, and closing."},
  {id:"cfpb-closing",name:"CFPB — Closing process",category:"Official Guidance",url:"https://www.consumerfinance.gov/owning-a-home/close/",official:true,notes:"Federal consumer guidance for underwriting requests, inspection, insurance, title services, documents, closing, and after closing."},
  {id:"cfpb-inspection",name:"CFPB — Home inspection",category:"Official Guidance",url:"https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/",official:true,notes:"Inspection timing, independence, appraisal distinction, and contingency considerations."},
  {id:"cfpb-disclosure",name:"CFPB — Closing Disclosure",category:"Official Guidance",url:"https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",official:true,notes:"For most financed purchases, lender delivery and the three-business-day review requirement."},
  {id:"ohio-records",name:"Ohio law — Transaction records",category:"Official Guidance",url:"https://codes.ohio.gov/ohio-revised-code/section-4735.18",official:true,notes:"Ohio transaction-record retention and document-copy requirements."},

  {id:"brokeragePortal",name:"Brokerage compliance / transaction system",category:"Work Portal",url:"",official:false,notes:"Examples may include the system required by your brokerage."},
  {id:"documentPortal",name:"Forms and e-signature",category:"Work Portal",url:"",official:false,notes:"Your approved contract, form, signature, or document-management platform."},
  {id:"mlsUrl",name:"MLS listing / transaction record",category:"Work Portal",url:"",official:false,notes:"Your MLS or the specific listing record."},
  {id:"showingPortal",name:"Showing / lockbox platform",category:"Work Portal",url:"",official:false,notes:"Showing scheduling, feedback, access, or offer-management platform."},
  {id:"lenderPortal",name:"Lender portal",category:"Work Portal",url:"",official:false,notes:"Secure lender status or document portal."},
  {id:"titlePortal",name:"Title / escrow portal",category:"Work Portal",url:"",official:false,notes:"Secure title, escrow, payoff, signing, or closing portal."},
  {id:"inspectionPortal",name:"Inspection / report portal",category:"Work Portal",url:"",official:false,notes:"Inspection scheduling or report access."},
  {id:"auditorUrl",name:"County auditor property search",category:"Public Records",url:"",official:false,notes:"County property, tax, legal-description, and parcel research."},
  {id:"recorderUrl",name:"County recorder search",category:"Public Records",url:"",official:false,notes:"Recorded deeds, mortgages, liens, releases, and land records."},
  {id:"hoaPortal",name:"HOA / condominium portal",category:"Work Portal",url:"",official:false,notes:"Resale certificates, governing documents, fees, and association contacts."},
  {id:"utilityUrl",name:"Utilities / service transfer",category:"Work Portal",url:"",official:false,notes:"Utility or municipal service-transfer resources."}
];

const financingStepKeys = new Set([
  "loan-application","loan-commitment","closing-disclosure","loan-status"
]);
const appraisalStepKeys = new Set([
  "appraisal-ordered","appraisal-complete","appraisal-resolution","appraisal-access","appraisal-result"
]);
const inspectionStepKeys = new Set([
  "schedule-inspection","inspection-complete","specialist-inspections","inspection-response","inspection-access","repair-agreement"
]);

buyerTransactionSteps.push(
  {key:"buyer-home-sale",phase:"Contract & Handoff",title:"Track the buyer’s current-home sale contingency",description:"Monitor the exact contingency terms, required status updates, notices, and written deadline from the purchase contract.",owner:"Agent",dateField:"buyerHomeSaleDeadline",required:true,condition:"buyerHomeSaleContingency"},
  {key:"hoa-review",phase:"Inspection & Due Diligence",title:"Receive and review HOA / condominium documents",description:"Track the contract deadline for resale certificates, governing documents, budgets, insurance, fees, assessments, and the buyer’s written decision.",owner:"Agent",dateField:"hoaReviewDeadline",required:true,condition:"hoaCondo"},
  {key:"well-septic-review",phase:"Inspection & Due Diligence",title:"Complete well, septic, and water-quality due diligence",description:"Schedule applicable inspections or tests, review reports, and complete any contract response before the due-diligence deadline.",owner:"Client",dateField:"inspectionDeadline",required:true,condition:"wellSeptic"},
  {key:"home-warranty",phase:"Title & Closing Prep",title:"Confirm home-warranty selection and ordering",description:"Verify coverage, provider, payer, cost limit, and delivery when the contract includes a home warranty.",owner:"Agent",base:"closingDate",offset:-5,required:false,condition:"homeWarranty"},
  {key:"occupancy-agreement",phase:"Final Walkthrough & Closing",title:"Verify post-closing occupancy terms and protections",description:"Confirm written occupancy terms, insurance, deposit or holdback, utilities, keys, condition documentation, and final possession.",owner:"Agent",dateField:"possessionDate",required:true,condition:"postClosingOccupancy"}
);
sellerTransactionSteps.push(
  {key:"buyer-home-sale",phase:"Contract & Handoff",title:"Monitor the buyer’s home-sale contingency",description:"Track required notices, status evidence, removal terms, and the exact written deadline in the purchase contract.",owner:"Agent",dateField:"buyerHomeSaleDeadline",required:true,condition:"buyerHomeSaleContingency"},
  {key:"hoa-order",phase:"Contract & Handoff",title:"Order and deliver HOA / condominium resale documents",description:"Track association contacts, fees, governing documents, assessments, insurance information, and delivery evidence.",owner:"Client",dateField:"hoaReviewDeadline",required:true,condition:"hoaCondo"},
  {key:"well-septic-docs",phase:"Inspection & Due Diligence",title:"Provide well, septic, and water records and access",description:"Collect service records, permits, test results, and coordinate access for any contract-required inspections.",owner:"Client",dateField:"inspectionDeadline",required:true,condition:"wellSeptic"},
  {key:"home-warranty",phase:"Title & Closing Prep",title:"Order the agreed home warranty",description:"Confirm provider, coverage, payer, cost limit, and proof of ordering when required by the contract.",owner:"Agent",base:"closingDate",offset:-5,required:false,condition:"homeWarranty"},
  {key:"occupancy-agreement",phase:"Final Walkthrough & Closing",title:"Administer post-closing occupancy and final possession",description:"Track written occupancy terms, insurance, deposit or holdback, utilities, keys, condition evidence, and possession release.",owner:"Agent",dateField:"possessionDate",required:true,condition:"postClosingOccupancy"}
);

function blankTransaction(contactId="",side="Seller"){
  return {
    id:uid(),contactId,propertyId:"",side,status:"Under Contract",
    street:"",unit:"",city:"",state:"OH",zip:"",county:"",
    purchasePrice:0,contractDate:TODAY(),closingDate:"",possessionDate:"",
    earnestMoneyAmount:0,earnestMoneyHolder:"",earnestMoneyDue:"",
    inspectionDeadline:"",inspectionResponseDeadline:"",financingApplicationDue:"",
    appraisalDeadline:"",loanCommitmentDeadline:"",titleDeadline:"",
    closingDisclosureDue:"",repairCompletionDate:"",finalWalkthroughDate:"",
    financingType:"Conventional",cashTransaction:false,
    inspectionApplies:true,financingApplies:true,appraisalApplies:true,
    hoaCondo:false,wellSeptic:false,repairsNegotiated:false,postClosingOccupancy:false,
    buyerHomeSaleContingency:false,homeWarranty:false,buyerHomeSaleDeadline:"",hoaReviewDeadline:"",
    pinnedNextStepId:"",
    brokeragePortal:"",documentPortal:"",mlsUrl:"",showingPortal:"",lenderPortal:"",titlePortal:"",
    inspectionPortal:"",auditorUrl:"",recorderUrl:"",hoaPortal:"",utilityUrl:"",
    lenderCompany:"",lenderName:"",lenderPhone:"",lenderEmail:"",
    titleCompany:"",titleName:"",titlePhone:"",titleEmail:"",
    inspectorCompany:"",inspectorName:"",inspectorPhone:"",inspectorEmail:"",
    cooperatingAgentName:"",cooperatingAgentPhone:"",cooperatingAgentEmail:"",
    gci:0,referralFee:0,brokerageSplit:0,notes:"",checklist:[],
    createdAt:NOW(),updatedAt:NOW(),closedAt:""
  }
}
function transaction(id){return (db.transactions||[]).find(tx=>tx.id===id)}
function transactionsForContact(contactId){return (db.transactions||[]).filter(tx=>tx.contactId===contactId)}
function activeTransactions(){return (db.transactions||[]).filter(tx=>!["Closed","Terminated"].includes(tx.status))}
function transactionProperty(tx){
  return db.properties.find(p=>p.id===tx?.propertyId)||null
}
function transactionAddress(tx){
  const p=transactionProperty(tx);
  if(p&&propertyAddress(p))return propertyAddress(p);
  const line=[tx?.street,tx?.unit].filter(Boolean).join(" ");
  const locality=[tx?.city,tx?.state,tx?.zip].filter(Boolean).join(" ");
  return [line,locality].filter(Boolean).join(", ")
}
function transactionAddressObject(tx){
  const p=transactionProperty(tx);
  return p?{street:p.street||"",unit:p.unit||"",city:p.city||"",state:p.state||"OH",zip:p.zip||"",county:p.county||""}:
    {street:tx?.street||"",unit:tx?.unit||"",city:tx?.city||"",state:tx?.state||"OH",zip:tx?.zip||"",county:tx?.county||""}
}
function transactionDaysToClose(tx){
  if(!tx?.closingDate)return null;
  const today=new Date(`${TODAY()}T12:00:00`),close=new Date(`${tx.closingDate}T12:00:00`);
  return Math.ceil((close-today)/86400000)
}
function transactionTemplate(tx){return tx.side==="Buyer"?buyerTransactionSteps:sellerTransactionSteps}
function transactionDueForTemplate(template,tx){
  if(template.dateField&&tx[template.dateField])return tx[template.dateField];
  if(template.base&&tx[template.base])return addDays(tx[template.base],template.offset||0);
  return ""
}
function transactionDeadlineType(template){
  if(template.dateField)return template.dateField==="closingDisclosureDue"?"Confirmed / Regulatory":"Contract Deadline";
  if(template.base)return "Suggested Target";
  return "Milestone"
}
function transactionTemplateApplies(template,tx){
  if(template.condition&&!tx[template.condition])return false;
  if(financingStepKeys.has(template.key)&&(!tx.financingApplies||tx.cashTransaction))return false;
  if(appraisalStepKeys.has(template.key)&&!tx.appraisalApplies)return false;
  if(inspectionStepKeys.has(template.key)&&!tx.inspectionApplies)return false;
  if(["repair-agreement","repair-work","repairs-verified","repair-completion"].includes(template.key)&&!tx.repairsNegotiated&&template.key!=="repair-agreement")return false;
  return true
}
function buildTransactionChecklist(tx,preserve=true){
  const existing=new Map((tx.checklist||[]).map(step=>[step.key,step]));
  const generated=transactionTemplate(tx).map((template,index)=>{
    const old=existing.get(template.key)||{},applicable=transactionTemplateApplies(template,tx);
    let status=old.status||"Not Started";
    if(!applicable&&!["Done","Problem"].includes(status))status="Skipped";
    if(applicable&&old.autoSkipped&&status==="Skipped")status="Not Started";
    return {
      id:old.id||uid(),key:template.key,phase:template.phase,title:template.title,
      description:template.description,due:old.customDue?old.due:transactionDueForTemplate(template,tx),
      customDue:Boolean(old.customDue),deadlineType:old.customDue?(old.deadlineType||"Custom Date"):transactionDeadlineType(template),
      status,owner:old.owner||template.owner,required:template.required!==false,
      notes:old.notes||"",completedAt:old.completedAt||"",resourceUrl:old.resourceUrl||"",
      applicable,autoSkipped:!applicable,sort:index,custom:false
    }
  });
  const custom=(tx.checklist||[]).filter(step=>step.custom).map(step=>({...step,applicable:step.applicable!==false,autoSkipped:false}));
  tx.checklist=[...generated,...custom].sort((a,b)=>(transactionPhases.indexOf(a.phase)-transactionPhases.indexOf(b.phase))||(a.sort||0)-(b.sort||0));
  if(tx.pinnedNextStepId&&!tx.checklist.some(step=>step.id===tx.pinnedNextStepId&&!["Done","Skipped"].includes(step.status)))tx.pinnedNextStepId=""
}
function normalizeTransaction(tx){
  const normalized={...blankTransaction(tx.contactId||"",tx.side||"Seller"),...tx,id:tx.id||uid(),
    purchasePrice:Number(tx.purchasePrice||0),earnestMoneyAmount:Number(tx.earnestMoneyAmount||0),
    gci:Number(tx.gci||0),referralFee:Number(tx.referralFee||0),brokerageSplit:Number(tx.brokerageSplit||0),
    checklist:Array.isArray(tx.checklist)?tx.checklist.map((step,index)=>({
      id:step.id||uid(),key:step.key||`custom-${uid()}`,phase:step.phase||"Contract & Handoff",
      title:step.title||"Transaction step",description:step.description||"",due:step.due||"",
      customDue:Boolean(step.customDue),deadlineType:step.deadlineType||"Custom Date",
      status:step.status||"Not Started",owner:step.owner||"Agent",
      required:step.required!==false,notes:step.notes||"",completedAt:step.completedAt||"",
      resourceUrl:step.resourceUrl||"",applicable:step.applicable!==false,autoSkipped:Boolean(step.autoSkipped),
      sort:Number(step.sort??index),custom:Boolean(step.custom)
    })):[]
  };
  buildTransactionChecklist(normalized,true);
  return normalized
}
function ensureTransactionForContact(c){
  if(!c||!["Buyer","Seller"].includes(c.type))return null;
  let tx=transactionsForContact(c.id).find(item=>!["Closed","Terminated"].includes(item.status));
  if(tx)return tx;
  tx=blankTransaction(c.id,c.type);
  const p=primaryProperty(c);
  if(p){
    tx.propertyId=p.id;
    const a={street:p.street||"",unit:p.unit||"",city:p.city||"",state:p.state||"OH",zip:p.zip||"",county:p.county||""};
    Object.assign(tx,a);
    tx.purchasePrice=Number(p.expectedSalePrice||p.listPrice||0)
  }
  tx.gci=Number(c.gci||0);
  buildTransactionChecklist(tx,false);
  db.transactions.unshift(tx);
  return tx
}
function transactionStepState(step){
  if(["Done","Skipped"].includes(step.status))return step.status.toLowerCase();
  if(step.status==="Problem")return "problem";
  if(step.due&&step.due<TODAY()&&["Contract Deadline","Confirmed / Regulatory","Custom Date"].includes(step.deadlineType))return "overdue";
  if(step.due&&step.due<TODAY()&&step.deadlineType==="Suggested Target")return "attention";
  if(step.due===TODAY())return "today";
  if(step.due&&step.due<=addDays(TODAY(),3))return "soon";
  return "open"
}
function transactionProgress(tx){
  const applicable=(tx.checklist||[]).filter(step=>step.status!=="Skipped");
  const done=applicable.filter(step=>step.status==="Done").length;
  return {done,total:applicable.length,pct:applicable.length?Math.round(done/applicable.length*100):0}
}
function transactionAudit(tx){
  const issues=[],add=(severity,label,detail)=>issues.push({severity,label,detail});
  if(!transactionAddress(tx))add("error","Property address missing","Link or enter the property under contract.");
  if(!tx.contractDate)add("error","Contract date missing","Enter the fully accepted contract date.");
  if(!tx.closingDate)add("error","Closing date missing","Enter the signed contract closing date.");
  if(tx.contractDate&&tx.closingDate&&tx.closingDate<tx.contractDate)add("error","Closing precedes contract","Recheck the dates against the signed agreement.");
  if(!tx.possessionDate)add("warning","Possession date missing","Closing and possession are not always the same.");
  if(!tx.earnestMoneyDue)add("warning","Earnest-money deadline missing","Enter the exact contract deadline or mark the step skipped if none applies.");
  if(tx.inspectionApplies&&!tx.inspectionDeadline)add("warning","Inspection deadline missing","Use the contract—not a default number of days.");
  if(tx.inspectionDeadline&&tx.inspectionResponseDeadline&&tx.inspectionResponseDeadline<tx.inspectionDeadline)add("warning","Inspection response precedes inspection deadline","Verify the sequence in the contract.");
  if(tx.financingApplies&&!tx.cashTransaction&&!tx.loanCommitmentDeadline)add("warning","Financing deadline missing","Enter the contract’s financing or commitment deadline when applicable.");
  if(tx.side==="Buyer"&&tx.financingApplies&&!tx.cashTransaction&&!tx.lenderName&&!tx.lenderCompany)add("warning","Lender contact missing","Add the loan officer or lender portal.");
  if(!tx.titleName&&!tx.titleCompany)add("warning","Title contact missing","Add the title or settlement contact handling the file.");
  if(tx.side==="Buyer"&&tx.financingApplies&&!tx.cashTransaction&&tx.closingDate&&tx.closingDate<=addDays(TODAY(),7)&&!tx.closingDisclosureDue)add("warning","Closing Disclosure receipt not confirmed","Track the lender-confirmed receipt date for most financed purchases.");
  if(tx.closingDisclosureDue&&tx.closingDate&&tx.closingDisclosureDue>tx.closingDate)add("error","Closing Disclosure date is after closing","Correct the date and immediately check with the lender.");
  if(tx.closingDate&&!tx.finalWalkthroughDate)add("warning","Final walkthrough not scheduled","Set the client-confirmed date and time.");
  if(tx.postClosingOccupancy&&!tx.possessionDate)add("error","Occupancy deal lacks possession date","Enter the written possession date and verify the occupancy agreement.");
  return issues
}
function transactionHealth(tx){
  if(tx.status==="Closed")return {label:"Closed",className:"closed"};
  if(tx.status==="Terminated")return {label:"Terminated",className:"terminated"};
  if(tx.status==="Clear to Close")return {label:"Clear to Close",className:"clear"};
  const audit=transactionAudit(tx);
  if(audit.some(issue=>issue.severity==="error"))return {label:"Setup / Error",className:"setup"};
  const open=(tx.checklist||[]).filter(step=>!["Done","Skipped"].includes(step.status));
  if(open.some(step=>step.status==="Problem"))return {label:"Problem",className:"problem"};
  if(open.some(step=>step.required&&step.due&&step.due<TODAY()&&["Contract Deadline","Confirmed / Regulatory","Custom Date"].includes(step.deadlineType)))return {label:"At Risk",className:"risk"};
  if(open.some(step=>step.due===TODAY()&&["Contract Deadline","Confirmed / Regulatory","Custom Date"].includes(step.deadlineType)))return {label:"Due Today",className:"today"};
  if(audit.some(issue=>issue.severity==="warning")||open.some(step=>step.due&&step.due<TODAY()&&step.deadlineType==="Suggested Target"))return {label:"Needs Attention",className:"attention"};
  return {label:"On Track",className:"track"}
}
function nextTransactionStep(tx){
  const open=(tx.checklist||[]).filter(step=>!["Done","Skipped"].includes(step.status));
  const pinned=open.find(step=>step.id===tx.pinnedNextStepId);
  if(pinned)return pinned;
  return open.sort((a,b)=>{
      if(a.status==="Problem"&&b.status!=="Problem")return -1;
      if(b.status==="Problem"&&a.status!=="Problem")return 1;
      const aContract=["Contract Deadline","Confirmed / Regulatory","Custom Date"].includes(a.deadlineType);
      const bContract=["Contract Deadline","Confirmed / Regulatory","Custom Date"].includes(b.deadlineType);
      if(aContract!==bContract)return aContract?-1:1;
      const ad=a.due||"9999-12-31",bd=b.due||"9999-12-31";
      return ad.localeCompare(bd)||(a.sort||0)-(b.sort||0)
    })[0]||null
}
function setTransactionNextStep(txId,stepId){
  const tx=transaction(txId),step=tx?.checklist.find(item=>item.id===stepId);if(!tx||!step)return;
  tx.pinnedNextStepId=stepId;tx.updatedAt=NOW();save();renderTransaction(txId);toast("Next step changed",step.title)
}
function clearTransactionNextStep(txId){
  const tx=transaction(txId);if(!tx)return;
  tx.pinnedNextStepId="";tx.updatedAt=NOW();save();renderTransaction(txId);toast("Automatic next step restored","The earliest urgent open step is now shown.")
}
function transactionNextStepModal(txId){
  const tx=transaction(txId);if(!tx)return;
  const open=(tx.checklist||[]).filter(step=>!["Done","Skipped"].includes(step.status));
  modal("Change next step",`<div class="next-step-picker">
    <p>Pin the exact action you want at the top of this transaction. You can change it again at any time.</p>
    ${open.map(step=>`<button class="next-step-choice ${step.id===tx.pinnedNextStepId?"active":""}" data-action="choose-tx-next" data-id="${tx.id}" data-step="${step.id}">
      <span>${esc(step.phase)}</span><strong>${esc(step.title)}</strong><small>${step.due?`${esc(step.deadlineType)} • ${dateLabel(step.due)}`:"No date"} • ${esc(step.owner)}</small>
    </button>`).join("")||`<div class="empty">No open steps remain.</div>`}
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="ghost-btn" data-action="clear-tx-next" data-id="${tx.id}">Use automatic next</button><button class="primary-btn" data-action="add-tx-step" data-id="${tx.id}">＋ Add custom step</button>`)
}
function completeTransactionNext(txId){
  const tx=transaction(txId),step=tx?nextTransactionStep(tx):null;if(!tx||!step)return;
  step.status="Done";step.completedAt=NOW();if(tx.pinnedNextStepId===step.id)tx.pinnedNextStepId="";
  tx.updatedAt=NOW();save();renderTransaction(txId);toast("Step completed",step.title)
}
function moveTransactionNextDate(txId,days){
  const tx=transaction(txId),step=tx?nextTransactionStep(tx):null;if(!step)return;
  step.due=addDays(step.due||TODAY(),Number(days||1));step.customDue=true;step.deadlineType="Custom Date";
  tx.pinnedNextStepId=step.id;tx.updatedAt=NOW();save();renderTransaction(txId);toast("Next step rescheduled",dateLabel(step.due))
}
function transactionDeadlineItems(){
  const items=[];
  activeTransactions().forEach(tx=>{
    const c=contact(tx.contactId);
    (tx.checklist||[]).filter(step=>!["Done","Skipped"].includes(step.status)&&(step.status==="Problem"||(step.due&&step.due<=TODAY()))).forEach(step=>{
      items.push({tx,c,step})
    })
  });
  return items.sort((a,b)=>{
    if(a.step.status==="Problem"&&b.step.status!=="Problem")return -1;
    if(b.step.status==="Problem"&&a.step.status!=="Problem")return 1;
    return String(a.step.due||"").localeCompare(String(b.step.due||""))
  })
}
function transactionSetupComplete(tx){
  return Boolean(tx.contactId&&tx.contractDate&&tx.closingDate&&transactionAddress(tx))
}
function transactionCriticalDates(tx){
  return [
    ["Contract accepted",tx.contractDate],
    ["Earnest money due",tx.earnestMoneyDue],
    ["Inspection deadline",tx.inspectionDeadline],
    ["Inspection response",tx.inspectionResponseDeadline],
    ["Financing application",tx.financingApplicationDue],
    ["Appraisal target",tx.appraisalDeadline],
    ["Loan commitment",tx.loanCommitmentDeadline],
    ["Title review",tx.titleDeadline],
    ["Closing Disclosure received",tx.closingDisclosureDue],
    ["Repairs complete",tx.repairCompletionDate],
    ["Final walkthrough",tx.finalWalkthroughDate],
    ["Closing",tx.closingDate],
    ["Possession",tx.possessionDate]
  ]
}

function transactionResource(id){return (db.transactionResources||[]).find(resource=>resource.id===id)}
function effectiveTransactionResource(tx,id){
  const direct=String(tx?.[id]||"").trim();
  if(direct)return direct;
  return String(transactionResource(id)?.url||"").trim()
}
function stepResourceKey(step){
  const key=step?.key||"",title=String(step?.title||"").toLowerCase();
  if(step?.resourceUrl)return "custom";
  if(["loan-application","loan-commitment","loan-status","appraisal-ordered","appraisal-complete","appraisal-resolution","appraisal-access","appraisal-result","closing-disclosure"].includes(key))return "lenderPortal";
  if(["open-title","title-commitment","title-clearance","deed-payoff","seller-closing-statement","closing-prep","closing-signing","seller-signing","funding-recording","proceeds-confirmed"].includes(key))return "titlePortal";
  if(key.includes("inspection")||key.includes("well-septic"))return "inspectionPortal";
  if(key.includes("hoa"))return "hoaPortal";
  if(key.includes("utilities")||key.includes("occupancy"))return "utilityUrl";
  if(key.includes("signed-contract")||key.includes("deliver-contract")||key.includes("agreement")||key.includes("closed-file"))return "documentPortal";
  if(title.includes("recording")||title.includes("deed"))return "recorderUrl";
  if(title.includes("property")||title.includes("title"))return "auditorUrl";
  return "brokeragePortal"
}
function stepResourceUrl(tx,step){
  if(step?.resourceUrl)return step.resourceUrl;
  const key=stepResourceKey(step);
  return key==="custom"?"":effectiveTransactionResource(tx,key)
}
function transactionResourceCardsHtml(tx){
  const specific=[
    ["brokeragePortal","Brokerage compliance"],
    ["documentPortal","Forms & e-signature"],
    ["mlsUrl","MLS record"],
    ["showingPortal","Showing / lockbox"],
    ["lenderPortal","Lender portal"],
    ["titlePortal","Title / escrow"],
    ["inspectionPortal","Inspection / report"],
    ["auditorUrl","County auditor"],
    ["recorderUrl","County recorder"],
    ["hoaPortal","HOA / condominium"],
    ["utilityUrl","Utilities"]
  ];
  const work=specific.map(([id,name])=>({id,name,url:effectiveTransactionResource(tx,id),official:false}));
  const official=(db.transactionResources||[]).filter(resource=>resource.official);
  return `<div class="tx-resource-groups">
    <div><label>WORK SITES</label><div class="tx-resource-grid">${work.map(resource=>resource.url?`<a target="_blank" rel="noopener" href="${esc(resource.url)}"><strong>${esc(resource.name)}</strong><span>Open ↗</span></a>`:`<button data-action="open-transaction" data-id="${tx.id}"><strong>${esc(resource.name)}</strong><span>Add link</span></button>`).join("")}</div></div>
    <div><label>VERIFIED REFERENCE GUIDES</label><div class="tx-resource-list">${official.map(resource=>`<a target="_blank" rel="noopener" href="${esc(resource.url)}"><div><strong>${esc(resource.name)}</strong><span>${esc(resource.notes||"Official reference")}</span></div><b>↗</b></a>`).join("")}</div></div>
  </div>`
}
function transactionResourcesSettingsHtml(){
  const resources=db.transactionResources||[];
  return `<section class="setting-card transaction-resource-settings"><div class="setting-card-head"><div><h3>Transaction sites & portals</h3><p>Set common links once. Each transaction can override them.</p></div><button class="primary-btn compact" data-action="open-transaction-resource">＋ Add</button></div>
    <div class="resource-settings-list">${resources.map(resource=>`<div class="resource-settings-row"><div><strong>${esc(resource.name)}</strong><span>${esc(resource.category)}${resource.url?` • ${esc(resource.url.split("://").pop().slice(0,42))}`:" • Link not set"}</span></div><button class="quick" data-action="open-transaction-resource" data-id="${resource.id}">${resource.official?"View":"Edit"}</button></div>`).join("")}</div>
  </section>`
}
function transactionResourceModal(id=""){
  const resource=transactionResource(id)||{id:"",name:"",category:"Work Portal",url:"",official:false,notes:""};
  modal(resource.official?"Official reference":"Transaction resource",`<div class="form-grid">
    <input id="transactionResourceId" type="hidden" value="${esc(resource.id)}">
    <div class="field"><label>Name</label><input id="transactionResourceName" value="${esc(resource.name)}" ${resource.official?"readonly":""}></div>
    <div class="field"><label>Category</label><input id="transactionResourceCategory" value="${esc(resource.category)}" ${resource.official?"readonly":""}></div>
    <div class="field full"><label>Website URL</label><input id="transactionResourceUrl" type="url" value="${esc(resource.url)}" ${resource.official?"readonly":""}></div>
    <div class="field full"><label>Purpose / note</label><textarea id="transactionResourceNotes" ${resource.official?"readonly":""}>${esc(resource.notes)}</textarea></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Close</button>${resource.official?`<a class="primary-btn" target="_blank" rel="noopener" href="${esc(resource.url)}">Open official guide</a>`:`${resource.id?`<button class="danger-btn" data-action="delete-transaction-resource" data-id="${resource.id}">Delete</button>`:""}<button class="primary-btn" data-action="save-transaction-resource">Save link</button>`}`)
}
function saveTransactionResource(){
  const id=document.getElementById("transactionResourceId").value||uid(),name=document.getElementById("transactionResourceName").value.trim(),url=document.getElementById("transactionResourceUrl").value.trim();
  if(!name)return alert("Add a resource name.");
  if(url&&!url.startsWith("https://")&&!url.startsWith("http://"))return alert("Website links must begin with https:// or http://");
  const resource={id,name,category:document.getElementById("transactionResourceCategory").value.trim()||"Work Portal",url,official:false,notes:document.getElementById("transactionResourceNotes").value.trim()};
  const index=db.transactionResources.findIndex(item=>item.id===id);if(index>=0)db.transactionResources[index]=resource;else db.transactionResources.push(resource);
  save();closeModal();renderSettings();toast("Transaction resource saved",name)
}
function deleteTransactionResource(id){
  const resource=transactionResource(id);if(!resource||resource.official)return;
  if(!confirm(`Delete ${resource.name}?`))return;
  db.transactionResources=db.transactionResources.filter(item=>item.id!==id);save();closeModal();renderSettings()
}

function transactionContactPanelHtml(c){
  const items=transactionsForContact(c.id).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if(!items.length){
    if(!["Buyer","Seller"].includes(c.type))return "";
    return `<div class="transaction-contact-empty"><div><strong>No transaction file yet.</strong><span>When this client goes under contract, create the critical dates and step-by-step closing workflow here.</span></div><button class="primary-btn compact" data-action="open-transaction" data-contact="${c.id}">＋ Start transaction</button></div>`
  }
  return `<div class="transaction-contact-list">${items.map(tx=>{
    const health=transactionHealth(tx),progress=transactionProgress(tx),next=nextTransactionStep(tx);
    return `<article class="transaction-contact-card">
      <div><span>${esc(tx.side)} side • ${esc(tx.status)}</span><strong>${esc(transactionAddress(tx)||"Address needed")}</strong><small>${tx.closingDate?`Closing ${dateLabel(tx.closingDate)}`:"Closing date needed"}${next?` • Next: ${esc(next.title)}`:""}</small></div>
      <div class="transaction-contact-progress"><b>${progress.pct}%</b><span class="tx-health ${health.className}">${health.label}</span></div>
      <a class="primary-btn compact" href="#/transaction/${tx.id}">Open transaction</a>
    </article>`
  }).join("")}</div>`
}
function transactionCardHtml(tx){
  const c=contact(tx.contactId),health=transactionHealth(tx),progress=transactionProgress(tx),next=nextTransactionStep(tx),days=transactionDaysToClose(tx);
  return `<article class="transaction-card">
    <div class="transaction-card-top"><span class="tx-side ${tx.side.toLowerCase()}">${esc(tx.side)} side</span><span class="tx-health ${health.className}">${health.label}</span></div>
    <h3><a href="#/transaction/${tx.id}">${esc(transactionAddress(tx)||"Property address needed")}</a></h3>
    <p>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Contact missing"} • ${money(tx.purchasePrice)}</p>
    <div class="transaction-close-count"><strong>${days===null?"—":days<0?Math.abs(days):days}</strong><span>${days===null?"Closing date needed":days<0?"days past closing":days===0?"closing today":"days to closing"}</span></div>
    <div class="tx-progress"><i style="width:${progress.pct}%"></i></div>
    <div class="transaction-card-meta"><span>${progress.done}/${progress.total} steps</span><span>${tx.closingDate?dateLabel(tx.closingDate):"No closing date"}</span></div>
    <div class="transaction-next"><label>NEXT STEP</label><strong>${next?esc(next.title):"Checklist complete"}</strong><small>${next?.due?dateLabel(next.due):"No date set"}</small></div>
    <a class="primary-btn compact full-width" href="#/transaction/${tx.id}">Manage transaction</a>
  </article>`
}
function transactionUpdateText(tx){
  const c=contact(tx.contactId),progress=transactionProgress(tx),nextSteps=(tx.checklist||[])
    .filter(step=>!["Done","Skipped"].includes(step.status))
    .sort((a,b)=>String(a.due||"9999").localeCompare(String(b.due||"9999"))).slice(0,3);
  const completed=(tx.checklist||[]).filter(step=>step.status==="Done").slice(-2);
  const intro=`Hi ${c?.firstName||"there"}, here is your Holton Homes ${tx.side.toLowerCase()} transaction update for ${transactionAddress(tx)||"the property"}.`;
  const done=completed.length?` Recently completed: ${completed.map(step=>step.title).join("; ")}.`:"";
  const next=nextSteps.length?` Next up: ${nextSteps.map(step=>`${step.title}${step.due?` by ${dateLabel(step.due)}`:""}`).join("; ")}.`:" The current checklist is complete.";
  const close=tx.closingDate?` Closing is currently scheduled for ${dateLabel(tx.closingDate)}.`:" We still need to confirm the closing date.";
  return `${intro}${done}${next}${close} We are ${progress.pct}% through the tracked process. I will contact you immediately if a deadline or issue needs your decision.`
}
function renderTransactions(){
  let items=[...(db.transactions||[])];
  if(state.transactionFilter==="active")items=items.filter(tx=>!["Closed","Terminated"].includes(tx.status));
  if(state.transactionFilter==="buyer")items=items.filter(tx=>tx.side==="Buyer"&&!["Closed","Terminated"].includes(tx.status));
  if(state.transactionFilter==="seller")items=items.filter(tx=>tx.side==="Seller"&&!["Closed","Terminated"].includes(tx.status));
  if(state.transactionFilter==="risk")items=items.filter(tx=>["risk","problem","setup"].includes(transactionHealth(tx).className)&&!["Closed","Terminated"].includes(tx.status));
  if(state.transactionFilter==="closed")items=items.filter(tx=>["Closed","Terminated"].includes(tx.status));
  items.sort((a,b)=>String(a.closingDate||"9999-12-31").localeCompare(String(b.closingDate||"9999-12-31")));
  const active=activeTransactions(),risk=active.filter(tx=>["risk","problem","setup"].includes(transactionHealth(tx).className)).length;
  const soon=active.filter(tx=>{const d=transactionDaysToClose(tx);return d!==null&&d>=0&&d<=14}).length;
  document.getElementById("view").innerHTML=
    backupWarningHtml()+
    pageHead("Contract to closing","Transaction Center","Critical dates, contingencies, responsibilities, client updates, and every buyer or seller step in one place.",`<button class="primary-btn" data-action="open-transaction">＋ New transaction</button>`) +
    `<section class="transaction-warning"><strong>Contract controls.</strong><span>Enter deadlines from the signed purchase agreement and brokerage instructions. The starter workflow is an operations checklist—not legal advice and not a substitute for the actual contract, lender, title company, broker, inspector, or attorney.</span></section>
    <section class="metric-grid transaction-metrics">
      <div class="metric"><label>Active deals</label><strong>${active.length}</strong><small>Buyer and seller sides</small></div>
      <div class="metric"><label>At risk / setup</label><strong>${risk}</strong><small>Needs immediate attention</small></div>
      <div class="metric"><label>Closing in 14 days</label><strong>${soon}</strong><small>Final preparation window</small></div>
      <div class="metric"><label>Due or overdue</label><strong>${transactionDeadlineItems().length}</strong><small>Open transaction steps</small></div>
    </section>
    <div class="toolbar transaction-filter">${[["active","Active"],["buyer","Buyer Side"],["seller","Seller Side"],["risk","At Risk"],["closed","Closed / Terminated"]].map(([id,label])=>`<button class="${state.transactionFilter===id?"primary-btn":"ghost-btn"} compact" data-action="transaction-filter" data-id="${id}">${label}</button>`).join("")}</div>
    <section class="transaction-grid">${items.length?items.map(transactionCardHtml).join(""):`<div class="empty transaction-empty"><strong>No transactions in this view.</strong><span>Move a buyer or seller under contract, or start a transaction manually.</span><button class="primary-btn" data-action="open-transaction">Start transaction</button></div>`}</section>`
}
function transactionCriticalDatesHtml(tx){
  return `<div class="critical-date-grid">${transactionCriticalDates(tx).map(([label,value])=>`<div class="${value&&value<TODAY()&&!["Closing","Possession"].includes(label)?"past":""}"><label>${esc(label)}</label><strong>${value?dateLabel(value):"Not set"}</strong></div>`).join("")}</div>`
}
function transactionPeopleHtml(tx){
  const groups=[
    ["Lender",tx.lenderName,tx.lenderCompany,tx.lenderPhone,tx.lenderEmail],
    ["Title / Escrow",tx.titleName,tx.titleCompany,tx.titlePhone,tx.titleEmail],
    ["Inspector",tx.inspectorName,tx.inspectorCompany,tx.inspectorPhone,tx.inspectorEmail],
    ["Cooperating Agent",tx.cooperatingAgentName,"",tx.cooperatingAgentPhone,tx.cooperatingAgentEmail]
  ];
  return groups.map(([role,name,company,phone,email])=>`<div class="tx-person">
    <label>${esc(role)}</label><strong>${esc(name||company||"Not added")}</strong>${name&&company?`<span>${esc(company)}</span>`:""}
    <div>${phone?`<a href="tel:${esc(phone.replace(/[^\d+]/g,""))}">☎ ${esc(phone)}</a>`:""}${email?`<a href="mailto:${esc(email)}">@ ${esc(email)}</a>`:""}</div>
  </div>`).join("")
}
function transactionChecklistHtml(tx){
  return transactionPhases.map(phase=>{
    const steps=(tx.checklist||[]).filter(step=>step.phase===phase);
    if(!steps.length)return "";
    const done=steps.filter(step=>["Done","Skipped"].includes(step.status)).length;
    return `<section class="tx-phase">
      <div class="tx-phase-head"><div><span>PHASE ${transactionPhases.indexOf(phase)+1}</span><h2>${esc(phase)}</h2></div><b>${done}/${steps.length}</b></div>
      <div class="tx-step-list">${steps.map(step=>{
        const stateClass=transactionStepState(step),resource=stepResourceUrl(tx,step),isNext=nextTransactionStep(tx)?.id===step.id;
        return `<article class="tx-step ${stateClass} ${isNext?"is-next":""}">
          <button class="tx-step-check" data-action="quick-complete-tx-step" data-id="${tx.id}" data-step="${step.id}" title="${step.status==="Done"?"Reopen":"Mark done"}">${step.status==="Done"?"✓":step.status==="Problem"?"!":""}</button>
          <div class="tx-step-copy"><div><strong>${esc(step.title)}</strong>${isNext?`<span class="next-badge">Next</span>`:""}${step.required?"<span>Required</span>":""}<span class="deadline-badge ${step.deadlineType.toLowerCase().replace(/[^a-z]+/g,"-")}">${esc(step.deadlineType)}</span></div><p>${esc(step.description)}</p>${step.notes?`<small>Note: ${esc(step.notes)}</small>`:""}${resource?`<a class="step-resource-link" target="_blank" rel="noopener" href="${esc(resource)}">Open related site ↗</a>`:""}</div>
          <div class="tx-step-controls">
            <select data-action="tx-step-status" data-id="${tx.id}" data-step="${step.id}">${transactionStepStatuses.map(status=>`<option ${step.status===status?"selected":""}>${status}</option>`).join("")}</select>
            <input type="date" value="${esc(step.due||"")}" data-action="tx-step-due" data-id="${tx.id}" data-step="${step.id}">
            <select data-action="tx-step-owner" data-id="${tx.id}" data-step="${step.id}">${transactionOwners.map(owner=>`<option ${step.owner===owner?"selected":""}>${owner}</option>`).join("")}</select>
            <button class="quick ${isNext?"active-next":""}" data-action="make-tx-next" data-id="${tx.id}" data-step="${step.id}">${isNext?"Pinned":"Make next"}</button>
            <button class="quick" data-action="edit-tx-step" data-id="${tx.id}" data-step="${step.id}">Edit</button>
          </div>
        </article>`
      }).join("")}</div>
    </section>`
  }).join("")
}

function transactionAuditHtml(tx){
  const issues=transactionAudit(tx);
  if(!issues.length)return `<section class="tx-audit clear"><div><strong>Flow audit passed</strong><span>Critical setup checks are complete. Continue to verify every date against the signed contract and amendments.</span></div><b>✓</b></section>`;
  return `<section class="tx-audit"><div class="tx-audit-head"><div><strong>Flow audit</strong><span>${issues.length} setup or sequence item${issues.length===1?"":"s"} need review.</span></div><button class="ghost-btn compact" data-action="open-transaction" data-id="${tx.id}">Fix setup</button></div>
    <div class="tx-audit-list">${issues.map(issue=>`<div class="${issue.severity}"><b>${issue.severity==="error"?"!":"?"}</b><div><strong>${esc(issue.label)}</strong><span>${esc(issue.detail)}</span></div></div>`).join("")}</div></section>`
}
function transactionFlowGuideHtml(tx){
  const flow=tx.side==="Buyer"?[
    ["1","Contract accepted","Signed copies, brokerage file, lender and title handoff"],
    ["2","Earnest money & title open","Deposit receipt and title / escrow file"],
    ["3","Inspection & due diligence","Inspection, specialists, HOA, well / septic and written response"],
    ["4","Loan, insurance & appraisal","Underwriting requests, insurance, appraisal and financing contingency"],
    ["5","Closing preparation","Title issues, final figures, Closing Disclosure and verified funds"],
    ["6","Walkthrough, closing & recording","Condition, signing, funding, deed recording, keys and possession"],
    ["7","Post-closing","Final documents, client check-ins and brokerage records"]
  ]:[
    ["1","Contract accepted","Signed copies, brokerage file, title and lender handoff"],
    ["2","Earnest money & seller title package","Deposit status, payoff, ownership, HOA and title information"],
    ["3","Inspection & negotiation","Access, written response, repairs, credits and amendments"],
    ["4","Appraisal & buyer financing","Access, lender status, required repairs and written resolution"],
    ["5","Closing preparation","Title clearance, seller statement, proceeds security and move plan"],
    ["6","Walkthrough, signing & possession","Repairs, property delivery, signing, funding, recording and keys"],
    ["7","Post-closing","Proceeds confirmation, closed file and relationship follow-up"]
  ];
  return `<section class="card card-pad tx-flow-guide"><div class="section-head"><div><h2>Verified process map</h2><p>Several lanes overlap. The contract and professionals—not the phase number—control timing.</p></div></div><div>${flow.map(([number,title,detail])=>`<div><b>${number}</b><span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span></div>`).join("")}</div></section>`
}
function transactionNextCommandHtml(tx){
  const step=nextTransactionStep(tx),resource=step?stepResourceUrl(tx,step):"",pinned=Boolean(step&&tx.pinnedNextStepId===step.id);
  return `<section class="tx-next-command">
    <div class="tx-next-label"><span>${pinned?"PINNED NEXT STEP":"AUTOMATIC NEXT STEP"}</span><h2>${step?esc(step.title):"Transaction checklist complete"}</h2><p>${step?`${esc(step.phase)} • ${step.due?dateLabel(step.due):"No date"} • ${esc(step.owner)} • ${esc(step.deadlineType)}`:"No open steps remain."}</p></div>
    <div class="tx-next-actions">
      ${resource?`<a class="ghost-btn" target="_blank" rel="noopener" href="${esc(resource)}">Open site ↗</a>`:""}
      ${step?`<button class="ghost-btn" data-action="move-tx-next-date" data-id="${tx.id}" data-days="1">Tomorrow</button><button class="primary-btn" data-action="complete-tx-next" data-id="${tx.id}">✓ Done & next</button>`:""}
      <button class="ghost-btn" data-action="change-tx-next" data-id="${tx.id}">Change next</button>
    </div>
  </section>`
}

function renderTransaction(id){
  const tx=transaction(id);if(!tx){location.hash="#/transactions";return}
  const c=contact(tx.contactId),health=transactionHealth(tx),progress=transactionProgress(tx),next=nextTransactionStep(tx),days=transactionDaysToClose(tx);
  document.getElementById("view").innerHTML=
    backupWarningHtml()+
    `<section class="transaction-detail-hero">
      <div><div class="eyebrow">${esc(tx.side)} TRANSACTION</div><h1>${esc(transactionAddress(tx)||"Property address needed")}</h1><p>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Contact missing"} • ${money(tx.purchasePrice)} • ${esc(tx.financingType||"Financing not set")}</p></div>
      <div class="transaction-detail-actions"><span class="tx-health ${health.className}">${health.label}</span><button class="ghost-btn" data-action="print-transaction">Print</button><button class="ghost-btn" data-action="open-transaction" data-id="${tx.id}">Edit setup</button><button class="primary-btn" data-action="transaction-status-menu" data-id="${tx.id}">Update status</button></div>
    </section>
    <section class="transaction-warning"><strong>Protect every deadline.</strong><span>Contract Deadline means a date entered from the signed agreement or amendment. Suggested Target is an editable operational goal and must never be treated as a contractual deadline.</span></section>
    ${transactionNextCommandHtml(tx)}
    ${transactionAuditHtml(tx)}
    <section class="transaction-detail-metrics">
      <div><label>Progress</label><strong>${progress.pct}%</strong><span>${progress.done} of ${progress.total} steps</span></div>
      <div><label>Closing countdown</label><strong>${days===null?"—":days}</strong><span>${days===null?"Set closing date":days===0?"Closing today":days<0?"Past scheduled closing":"days remaining"}</span></div>
      <div><label>Next-step control</label><strong>${tx.pinnedNextStepId?"Pinned":"Automatic"}</strong><span>${next?.due?`${dateLabel(next.due)} • ${next.deadlineType}`:"No due date"}</span></div>
      <div><label>Projected GCI</label><strong>${money(tx.gci)}</strong><span>${tx.referralFee?`${tx.referralFee}% referral`:"No referral entered"}</span></div>
    </section>
    <div class="transaction-detail-layout">
      <main class="transaction-main">
        <section class="card transaction-update-card"><div class="section-head"><div><h2>Client update</h2><p>Copy a clear status update without exposing internal notes.</p></div><div><button class="ghost-btn compact" data-action="copy-transaction-update" data-id="${tx.id}">Copy update</button>${c&&hasPhone(c)?`<button class="primary-btn compact" data-action="text-transaction-update" data-id="${tx.id}">Text client</button>`:""}</div></div><blockquote>${esc(transactionUpdateText(tx))}</blockquote></section>
        ${transactionChecklistHtml(tx)}
        <button class="ghost-btn full-width add-tx-step" data-action="add-tx-step" data-id="${tx.id}">＋ Add custom transaction step</button>
      </main>
      <aside class="transaction-sidebar">
        ${transactionFlowGuideHtml(tx)}
        <section class="card card-pad"><div class="section-head"><div><h2>Critical dates</h2><p>Use exact contract and confirmed lender dates.</p></div></div>${transactionCriticalDatesHtml(tx)}</section>
        <section class="card card-pad"><div class="section-head"><div><h2>Transaction team</h2><p>One-touch communication.</p></div></div><div class="tx-people">${transactionPeopleHtml(tx)}</div></section>
        <section class="card card-pad"><div class="section-head"><div><h2>Money & terms</h2></div></div><div class="detail-grid">
          ${detail("Purchase price",money(tx.purchasePrice))}${detail("Earnest money",money(tx.earnestMoneyAmount))}${detail("Earnest holder",tx.earnestMoneyHolder||"Not set")}${detail("Financing",tx.cashTransaction?"Cash":tx.financingType||"Not set")}${detail("Possession",dateLabel(tx.possessionDate))}${detail("Status",tx.status)}
        </div></section>
        <section class="card card-pad"><div class="section-head"><div><h2>Sites & portals</h2><p>Open the established systems used to complete the deal.</p></div><button class="ghost-btn compact" data-action="open-transaction" data-id="${tx.id}">Edit links</button></div>${transactionResourceCardsHtml(tx)}</section>
        <section class="wire-warning"><strong>Wire-fraud checkpoint</strong><span>Never trust changed wiring instructions from an unexpected email. Verify instructions through a known title-company phone number before funds are sent.</span></section>
        <section class="card card-pad"><div class="section-head"><div><h2>Internal transaction notes</h2></div></div><p class="tx-notes">${esc(tx.notes||"No internal notes yet.")}</p><button class="ghost-btn compact full-width" data-action="open-transaction" data-id="${tx.id}">Edit notes and setup</button></section>
      </aside>
    </div>`
}
function transactionModal(id="",contactId=""){
  const existing=transaction(id),c=contact(contactId||existing?.contactId),tx=existing?JSON.parse(JSON.stringify(existing)):blankTransaction(c?.id||"",c?.type==="Buyer"?"Buyer":"Seller");
  const contactChoices=db.contacts.filter(person=>["Buyer","Seller"].includes(person.type)).map(person=>`<option value="${person.id}" ${person.id===tx.contactId?"selected":""}>${esc(fullName(person))} — ${esc(person.type)}</option>`).join("");
  const propertyChoices=(c?propertiesForContact(c.id):[]).map(p=>`<option value="${p.id}" ${p.id===tx.propertyId?"selected":""}>${esc(propertyAddress(p)||p.role)}</option>`).join("");
  modal(existing?"Edit transaction setup":"Start transaction",`<div class="form-grid transaction-form">
    <input type="hidden" id="transactionId" value="${esc(tx.id)}">
    <div class="field"><label>Client</label><select id="transactionContact"><option value="">Choose buyer or seller</option>${contactChoices}</select></div>
    <div class="field"><label>Representation side</label><select id="transactionSide">${["Buyer","Seller"].map(side=>`<option ${tx.side===side?"selected":""}>${side}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select id="transactionStatus">${["Under Contract","At Risk","Clear to Close","Closed","Terminated"].map(status=>`<option ${tx.status===status?"selected":""}>${status}</option>`).join("")}</select></div>
    <div class="field"><label>Linked property</label><select id="transactionProperty"><option value="">Use address below</option>${propertyChoices}</select></div>

    <div class="field full section-label">Property under contract</div>
    <div class="field full"><label>Street address</label><input id="transactionStreet" value="${esc(tx.street||transactionAddressObject(tx).street)}"></div>
    <div class="field"><label>Unit</label><input id="transactionUnit" value="${esc(tx.unit||transactionAddressObject(tx).unit)}"></div>
    <div class="field"><label>City</label><input id="transactionCity" value="${esc(tx.city||transactionAddressObject(tx).city)}"></div>
    <div class="field"><label>State</label><input id="transactionState" value="${esc(tx.state||transactionAddressObject(tx).state||"OH")}"></div>
    <div class="field"><label>ZIP</label><input id="transactionZip" value="${esc(tx.zip||transactionAddressObject(tx).zip)}"></div>
    <div class="field"><label>County</label><input id="transactionCounty" value="${esc(tx.county||transactionAddressObject(tx).county)}"></div>
    <div class="field"><label>Purchase price</label><input id="transactionPrice" type="number" min="0" value="${tx.purchasePrice||""}"></div>

    <div class="field full section-label">Contract dates — enter the signed agreement dates</div>
    <div class="field"><label>Contract accepted</label><input id="transactionContractDate" type="date" value="${esc(tx.contractDate)}"></div>
    <div class="field"><label>Closing</label><input id="transactionClosingDate" type="date" value="${esc(tx.closingDate)}"></div>
    <div class="field"><label>Possession</label><input id="transactionPossessionDate" type="date" value="${esc(tx.possessionDate)}"></div>
    <div class="field"><label>Earnest money due</label><input id="transactionEarnestDue" type="date" value="${esc(tx.earnestMoneyDue)}"></div>
    <div class="field"><label>Inspection deadline</label><input id="transactionInspectionDeadline" type="date" value="${esc(tx.inspectionDeadline)}"></div>
    <div class="field"><label>Inspection response deadline</label><input id="transactionInspectionResponse" type="date" value="${esc(tx.inspectionResponseDeadline)}"></div>
    <div class="field"><label>Financing application due</label><input id="transactionFinancingApplication" type="date" value="${esc(tx.financingApplicationDue)}"></div>
    <div class="field"><label>Appraisal target / deadline</label><input id="transactionAppraisalDeadline" type="date" value="${esc(tx.appraisalDeadline)}"></div>
    <div class="field"><label>Loan commitment deadline</label><input id="transactionLoanCommitment" type="date" value="${esc(tx.loanCommitmentDeadline)}"></div>
    <div class="field"><label>Title review deadline</label><input id="transactionTitleDeadline" type="date" value="${esc(tx.titleDeadline)}"></div>
    <div class="field"><label>Closing Disclosure received</label><input id="transactionClosingDisclosure" type="date" value="${esc(tx.closingDisclosureDue)}"></div>
    <div class="field"><label>Repairs complete</label><input id="transactionRepairCompletion" type="date" value="${esc(tx.repairCompletionDate)}"></div>
    <div class="field"><label>Final walkthrough</label><input id="transactionWalkthrough" type="date" value="${esc(tx.finalWalkthroughDate)}"></div>

    <div class="field full section-label">Earnest money and financing</div>
    <div class="field"><label>Earnest amount</label><input id="transactionEarnestAmount" type="number" min="0" value="${tx.earnestMoneyAmount||""}"></div>
    <div class="field"><label>Earnest holder</label><input id="transactionEarnestHolder" value="${esc(tx.earnestMoneyHolder)}"></div>
    <div class="field"><label>Financing type</label><select id="transactionFinancingType">${["Conventional","FHA","VA","USDA","Cash","Other"].map(type=>`<option ${tx.financingType===type?"selected":""}>${type}</option>`).join("")}</select></div>
    <div class="field"><label>Projected GCI</label><input id="transactionGci" type="number" min="0" value="${tx.gci||""}"></div>
    <div class="field full section-label">Deal conditions — controls which steps apply</div>
    <div class="field full transaction-condition-grid">
      <label class="checkbox-row"><input id="transactionInspectionApplies" type="checkbox" ${tx.inspectionApplies?"checked":""}> Inspection / due diligence applies</label>
      <label class="checkbox-row"><input id="transactionFinancingApplies" type="checkbox" ${tx.financingApplies?"checked":""}> Financing contingency / lender workflow applies</label>
      <label class="checkbox-row"><input id="transactionAppraisalApplies" type="checkbox" ${tx.appraisalApplies?"checked":""}> Appraisal applies</label>
      <label class="checkbox-row"><input id="transactionRepairsNegotiated" type="checkbox" ${tx.repairsNegotiated?"checked":""}> Repairs or credits were negotiated</label>
      <label class="checkbox-row"><input id="transactionHoaCondo" type="checkbox" ${tx.hoaCondo?"checked":""}> HOA / condominium documents apply</label>
      <label class="checkbox-row"><input id="transactionWellSeptic" type="checkbox" ${tx.wellSeptic?"checked":""}> Well / septic due diligence applies</label>
      <label class="checkbox-row"><input id="transactionBuyerHomeSale" type="checkbox" ${tx.buyerHomeSaleContingency?"checked":""}> Buyer home-sale contingency applies</label>
      <label class="checkbox-row"><input id="transactionPostClosingOccupancy" type="checkbox" ${tx.postClosingOccupancy?"checked":""}> Post-closing occupancy applies</label>
      <label class="checkbox-row"><input id="transactionHomeWarranty" type="checkbox" ${tx.homeWarranty?"checked":""}> Home warranty is in the contract</label>
    </div>
    <div class="field"><label>Buyer home-sale deadline</label><input id="transactionBuyerHomeSaleDeadline" type="date" value="${esc(tx.buyerHomeSaleDeadline||"")}"></div>
    <div class="field"><label>HOA / condo review deadline</label><input id="transactionHoaReviewDeadline" type="date" value="${esc(tx.hoaReviewDeadline||"")}"></div>
    <div class="field"><label>Referral fee %</label><input id="transactionReferralFee" type="number" min="0" max="100" value="${tx.referralFee||""}"></div>
    <div class="field"><label>Broker split %</label><input id="transactionBrokerSplit" type="number" min="0" max="100" value="${tx.brokerageSplit||""}"></div>

    <div class="field full section-label">Lender</div>
    <div class="field"><label>Company</label><input id="transactionLenderCompany" value="${esc(tx.lenderCompany)}"></div>
    <div class="field"><label>Loan officer</label><input id="transactionLenderName" value="${esc(tx.lenderName)}"></div>
    <div class="field"><label>Phone</label><input id="transactionLenderPhone" type="tel" value="${esc(tx.lenderPhone)}"></div>
    <div class="field"><label>Email</label><input id="transactionLenderEmail" type="email" value="${esc(tx.lenderEmail)}"></div>

    <div class="field full section-label">Title / escrow</div>
    <div class="field"><label>Company</label><input id="transactionTitleCompany" value="${esc(tx.titleCompany)}"></div>
    <div class="field"><label>Contact</label><input id="transactionTitleName" value="${esc(tx.titleName)}"></div>
    <div class="field"><label>Phone</label><input id="transactionTitlePhone" type="tel" value="${esc(tx.titlePhone)}"></div>
    <div class="field"><label>Email</label><input id="transactionTitleEmail" type="email" value="${esc(tx.titleEmail)}"></div>

    <div class="field full section-label">Inspector and cooperating agent</div>
    <div class="field"><label>Inspector / company</label><input id="transactionInspectorName" value="${esc(tx.inspectorName||tx.inspectorCompany)}"></div>
    <div class="field"><label>Inspector phone</label><input id="transactionInspectorPhone" type="tel" value="${esc(tx.inspectorPhone)}"></div>
    <div class="field"><label>Cooperating agent</label><input id="transactionCoopName" value="${esc(tx.cooperatingAgentName)}"></div>
    <div class="field"><label>Agent phone</label><input id="transactionCoopPhone" type="tel" value="${esc(tx.cooperatingAgentPhone)}"></div>
    <div class="field"><label>Agent email</label><input id="transactionCoopEmail" type="email" value="${esc(tx.cooperatingAgentEmail)}"></div>

    <div class="field full section-label">Established sites and portals — transaction overrides</div>
    <div class="field"><label>Brokerage compliance</label><input id="transactionBrokeragePortal" type="url" value="${esc(tx.brokeragePortal||"")}" placeholder="${esc(transactionResource("brokeragePortal")?.url||"https://")}"></div>
    <div class="field"><label>Forms / e-signature</label><input id="transactionDocumentPortal" type="url" value="${esc(tx.documentPortal||"")}" placeholder="${esc(transactionResource("documentPortal")?.url||"https://")}"></div>
    <div class="field"><label>MLS record</label><input id="transactionMlsUrl" type="url" value="${esc(tx.mlsUrl||"")}" placeholder="${esc(transactionResource("mlsUrl")?.url||"https://")}"></div>
    <div class="field"><label>Showing / lockbox</label><input id="transactionShowingPortal" type="url" value="${esc(tx.showingPortal||"")}" placeholder="${esc(transactionResource("showingPortal")?.url||"https://")}"></div>
    <div class="field"><label>Lender portal</label><input id="transactionLenderPortal" type="url" value="${esc(tx.lenderPortal||"")}" placeholder="${esc(transactionResource("lenderPortal")?.url||"https://")}"></div>
    <div class="field"><label>Title / escrow portal</label><input id="transactionTitlePortal" type="url" value="${esc(tx.titlePortal||"")}" placeholder="${esc(transactionResource("titlePortal")?.url||"https://")}"></div>
    <div class="field"><label>Inspection / report</label><input id="transactionInspectionPortal" type="url" value="${esc(tx.inspectionPortal||"")}" placeholder="${esc(transactionResource("inspectionPortal")?.url||"https://")}"></div>
    <div class="field"><label>County auditor</label><input id="transactionAuditorUrl" type="url" value="${esc(tx.auditorUrl||"")}" placeholder="${esc(transactionResource("auditorUrl")?.url||"https://")}"></div>
    <div class="field"><label>County recorder</label><input id="transactionRecorderUrl" type="url" value="${esc(tx.recorderUrl||"")}" placeholder="${esc(transactionResource("recorderUrl")?.url||"https://")}"></div>
    <div class="field"><label>HOA / condo portal</label><input id="transactionHoaPortal" type="url" value="${esc(tx.hoaPortal||"")}" placeholder="${esc(transactionResource("hoaPortal")?.url||"https://")}"></div>
    <div class="field"><label>Utilities</label><input id="transactionUtilityUrl" type="url" value="${esc(tx.utilityUrl||"")}" placeholder="${esc(transactionResource("utilityUrl")?.url||"https://")}"></div>

    <div class="field full"><label>Internal transaction notes</label><textarea id="transactionNotes" rows="5">${esc(tx.notes)}</textarea></div>
    <div class="field full"><label class="checkbox-row"><input id="transactionRebuild" type="checkbox"> Rebuild suggested targets and conditional steps while preserving completed work</label></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>${existing?`<button class="danger-btn" data-action="terminate-transaction" data-id="${tx.id}">Terminate</button>`:""}<button class="primary-btn" data-action="save-transaction">Save transaction</button>`)
}
function saveTransaction(){
  const id=document.getElementById("transactionId").value||uid(),old=transaction(id);
  const contactId=document.getElementById("transactionContact").value,c=contact(contactId);
  if(!c)return alert("Choose a buyer or seller contact.");
  const tx=old||blankTransaction(contactId,document.getElementById("transactionSide").value);
  Object.assign(tx,{
    id,contactId,side:document.getElementById("transactionSide").value,status:document.getElementById("transactionStatus").value,
    propertyId:document.getElementById("transactionProperty").value,
    street:document.getElementById("transactionStreet").value.trim(),unit:document.getElementById("transactionUnit").value.trim(),
    city:document.getElementById("transactionCity").value.trim(),state:document.getElementById("transactionState").value.trim()||"OH",
    zip:document.getElementById("transactionZip").value.trim(),county:document.getElementById("transactionCounty").value.trim(),
    purchasePrice:Number(document.getElementById("transactionPrice").value||0),
    contractDate:document.getElementById("transactionContractDate").value,closingDate:document.getElementById("transactionClosingDate").value,
    possessionDate:document.getElementById("transactionPossessionDate").value,
    earnestMoneyDue:document.getElementById("transactionEarnestDue").value,
    inspectionDeadline:document.getElementById("transactionInspectionDeadline").value,
    inspectionResponseDeadline:document.getElementById("transactionInspectionResponse").value,
    financingApplicationDue:document.getElementById("transactionFinancingApplication").value,
    appraisalDeadline:document.getElementById("transactionAppraisalDeadline").value,
    loanCommitmentDeadline:document.getElementById("transactionLoanCommitment").value,
    titleDeadline:document.getElementById("transactionTitleDeadline").value,
    closingDisclosureDue:document.getElementById("transactionClosingDisclosure").value,
    repairCompletionDate:document.getElementById("transactionRepairCompletion").value,
    finalWalkthroughDate:document.getElementById("transactionWalkthrough").value,
    earnestMoneyAmount:Number(document.getElementById("transactionEarnestAmount").value||0),
    earnestMoneyHolder:document.getElementById("transactionEarnestHolder").value.trim(),
    financingType:document.getElementById("transactionFinancingType").value,
    cashTransaction:document.getElementById("transactionFinancingType").value==="Cash",
    inspectionApplies:document.getElementById("transactionInspectionApplies").checked,
    financingApplies:document.getElementById("transactionFinancingType").value!=="Cash"&&document.getElementById("transactionFinancingApplies").checked,
    appraisalApplies:document.getElementById("transactionAppraisalApplies").checked,
    repairsNegotiated:document.getElementById("transactionRepairsNegotiated").checked,
    hoaCondo:document.getElementById("transactionHoaCondo").checked,
    wellSeptic:document.getElementById("transactionWellSeptic").checked,
    buyerHomeSaleContingency:document.getElementById("transactionBuyerHomeSale").checked,
    postClosingOccupancy:document.getElementById("transactionPostClosingOccupancy").checked,
    homeWarranty:document.getElementById("transactionHomeWarranty").checked,
    buyerHomeSaleDeadline:document.getElementById("transactionBuyerHomeSaleDeadline").value,
    hoaReviewDeadline:document.getElementById("transactionHoaReviewDeadline").value,
    gci:Number(document.getElementById("transactionGci").value||0),
    referralFee:Number(document.getElementById("transactionReferralFee").value||0),
    brokerageSplit:Number(document.getElementById("transactionBrokerSplit").value||0),
    lenderCompany:document.getElementById("transactionLenderCompany").value.trim(),
    lenderName:document.getElementById("transactionLenderName").value.trim(),
    lenderPhone:document.getElementById("transactionLenderPhone").value.trim(),
    lenderEmail:document.getElementById("transactionLenderEmail").value.trim(),
    titleCompany:document.getElementById("transactionTitleCompany").value.trim(),
    titleName:document.getElementById("transactionTitleName").value.trim(),
    titlePhone:document.getElementById("transactionTitlePhone").value.trim(),
    titleEmail:document.getElementById("transactionTitleEmail").value.trim(),
    inspectorName:document.getElementById("transactionInspectorName").value.trim(),
    inspectorCompany:document.getElementById("transactionInspectorName").value.trim(),
    inspectorPhone:document.getElementById("transactionInspectorPhone").value.trim(),
    cooperatingAgentName:document.getElementById("transactionCoopName").value.trim(),
    cooperatingAgentPhone:document.getElementById("transactionCoopPhone").value.trim(),
    cooperatingAgentEmail:document.getElementById("transactionCoopEmail").value.trim(),
    brokeragePortal:document.getElementById("transactionBrokeragePortal").value.trim(),
    documentPortal:document.getElementById("transactionDocumentPortal").value.trim(),
    mlsUrl:document.getElementById("transactionMlsUrl").value.trim(),
    showingPortal:document.getElementById("transactionShowingPortal").value.trim(),
    lenderPortal:document.getElementById("transactionLenderPortal").value.trim(),
    titlePortal:document.getElementById("transactionTitlePortal").value.trim(),
    inspectionPortal:document.getElementById("transactionInspectionPortal").value.trim(),
    auditorUrl:document.getElementById("transactionAuditorUrl").value.trim(),
    recorderUrl:document.getElementById("transactionRecorderUrl").value.trim(),
    hoaPortal:document.getElementById("transactionHoaPortal").value.trim(),
    utilityUrl:document.getElementById("transactionUtilityUrl").value.trim(),
    notes:document.getElementById("transactionNotes").value.trim(),updatedAt:NOW()
  });
  const urls=["brokeragePortal","documentPortal","mlsUrl","showingPortal","lenderPortal","titlePortal","inspectionPortal","auditorUrl","recorderUrl","hoaPortal","utilityUrl"];
  const badUrl=urls.find(key=>tx[key]&&!tx[key].startsWith("https://")&&!tx[key].startsWith("http://"));if(badUrl)return alert("Every website link must begin with https:// or http://");
  if(!tx.contractDate)return alert("Enter the contract acceptance date.");
  if(!transactionAddress(tx)&&!tx.propertyId)return alert("Enter or link the property address.");
  if(document.getElementById("transactionRebuild").checked){
    (tx.checklist||[]).forEach(step=>{if(!step.custom)step.customDue=false})
  }
  buildTransactionChecklist(tx,true);
  if(!old)db.transactions.unshift(tx);
  c.stage=tx.status==="Closed"?"Closed":tx.status==="Terminated"?"Lost":"Under Contract";
  c.type=tx.side;c.gci=tx.gci||c.gci;c.updatedAt=TODAY();
  if(!tx.propertyId&&tx.street){
    const p={
      id:uid(),contactId:c.id,role:tx.side==="Buyer"?"Buyer Purchase":"Seller Property",status:tx.status==="Closed"?"Closed":"Under Contract",
      primary:true,street:tx.street,unit:tx.unit,city:tx.city,state:tx.state,zip:tx.zip,county:tx.county,
      propertyType:"Single Family",beds:"",baths:"",sqft:"",acres:"",yearBuilt:"",occupancy:"Unknown",ownership:"Unknown",
      estimatedValue:tx.purchasePrice,mortgageBalance:0,listPrice:0,expectedSalePrice:tx.purchasePrice,
      targetDate:tx.closingDate,appointmentDate:"",condition:"",motivation:"",notes:"Created from transaction setup.",createdAt:TODAY(),updatedAt:TODAY()
    };
    propertiesForContact(c.id).forEach(item=>item.primary=false);
    db.properties.push(p);tx.propertyId=p.id
  }
  const p=transactionProperty(tx);
  if(p){p.status=tx.status==="Closed"?"Closed":"Under Contract";p.expectedSalePrice=tx.purchasePrice||p.expectedSalePrice;p.targetDate=tx.closingDate||p.targetDate;p.updatedAt=TODAY()}
  save();closeModal();location.hash=`#/transaction/${tx.id}`;toast("Transaction saved",`${fullName(c)} • ${transactionAddress(tx)}`)
}
function transactionStepModal(txId,stepId=""){
  const tx=transaction(txId),step=(tx?.checklist||[]).find(item=>item.id===stepId)||{id:"",phase:"Contract & Handoff",title:"",description:"",due:"",deadlineType:"Custom Date",resourceUrl:"",owner:"Agent",status:"Not Started",required:true,notes:"",custom:true};
  if(!tx)return;
  modal(step.id?"Edit transaction step":"Add transaction step",`<div class="form-grid">
    <input type="hidden" id="txStepTransactionId" value="${tx.id}">
    <input type="hidden" id="txStepId" value="${esc(step.id)}">
    <div class="field"><label>Phase</label><select id="txStepPhase">${transactionPhases.map(phase=>`<option ${step.phase===phase?"selected":""}>${phase}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select id="txStepStatus">${transactionStepStatuses.map(status=>`<option ${step.status===status?"selected":""}>${status}</option>`).join("")}</select></div>
    <div class="field full"><label>Step</label><input id="txStepTitle" value="${esc(step.title)}"></div>
    <div class="field full"><label>What must happen</label><textarea id="txStepDescription">${esc(step.description)}</textarea></div>
    <div class="field"><label>Due date</label><input id="txStepDue" type="date" value="${esc(step.due)}"></div>
    <div class="field"><label>Date meaning</label><select id="txStepDeadlineType">${["Contract Deadline","Confirmed / Regulatory","Suggested Target","Custom Date","Milestone"].map(type=>`<option ${step.deadlineType===type?"selected":""}>${type}</option>`).join("")}</select></div>
    <div class="field"><label>Responsible</label><select id="txStepOwner">${transactionOwners.map(owner=>`<option ${step.owner===owner?"selected":""}>${owner}</option>`).join("")}</select></div>
    <div class="field full"><label>Related website for this step</label><input id="txStepResourceUrl" type="url" value="${esc(step.resourceUrl||"")}" placeholder="https://"></div>
    <div class="field full"><label>Internal note / blocker</label><textarea id="txStepNotes">${esc(step.notes)}</textarea></div>
    <div class="field full"><label class="checkbox-row"><input id="txStepMakeNext" type="checkbox" ${tx.pinnedNextStepId===step.id?"checked":""}> Pin this as the transaction’s next step</label></div>
    <div class="field full"><label class="checkbox-row"><input id="txStepRequired" type="checkbox" ${step.required?"checked":""}> Treat as a required transaction step</label></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>${step.id&&step.custom?`<button class="danger-btn" data-action="delete-tx-step" data-id="${tx.id}" data-step="${step.id}">Delete</button>`:""}<button class="primary-btn" data-action="save-tx-step">Save step</button>`)
}
function saveTransactionStep(){
  const tx=transaction(document.getElementById("txStepTransactionId").value);if(!tx)return;
  const id=document.getElementById("txStepId").value||uid(),old=tx.checklist.find(step=>step.id===id);
  const step={
    id,key:old?.key||`custom-${uid()}`,phase:document.getElementById("txStepPhase").value,
    title:document.getElementById("txStepTitle").value.trim(),description:document.getElementById("txStepDescription").value.trim(),
    due:document.getElementById("txStepDue").value,customDue:true,deadlineType:document.getElementById("txStepDeadlineType").value,status:document.getElementById("txStepStatus").value,
    owner:document.getElementById("txStepOwner").value,required:document.getElementById("txStepRequired").checked,
    notes:document.getElementById("txStepNotes").value.trim(),resourceUrl:document.getElementById("txStepResourceUrl").value.trim(),
    completedAt:document.getElementById("txStepStatus").value==="Done"?(old?.completedAt||NOW()):"",
    sort:old?.sort??tx.checklist.length,custom:old?.custom??true
  };
  if(!step.title)return alert("Add a step title.");
  if(step.resourceUrl&&!step.resourceUrl.startsWith("https://")&&!step.resourceUrl.startsWith("http://"))return alert("The related website must begin with https:// or http://");
  const index=tx.checklist.findIndex(item=>item.id===id);if(index>=0)tx.checklist[index]=step;else tx.checklist.push(step);
  if(document.getElementById("txStepMakeNext").checked)tx.pinnedNextStepId=id;else if(tx.pinnedNextStepId===id)tx.pinnedNextStepId="";
  tx.updatedAt=NOW();save();closeModal();renderTransaction(tx.id);toast("Transaction step saved",step.title)
}
function updateTransactionStep(txId,stepId,field,value){
  const tx=transaction(txId),step=tx?.checklist.find(item=>item.id===stepId);if(!step)return;
  step[field]=value;
  if(field==="status")step.completedAt=value==="Done"?NOW():"";
  if(field==="due")step.customDue=true;
  tx.updatedAt=NOW();save();renderTransaction(tx.id)
}
function quickCompleteTransactionStep(txId,stepId){
  const tx=transaction(txId),step=tx?.checklist.find(item=>item.id===stepId);if(!step)return;
  step.status=step.status==="Done"?"Not Started":"Done";step.completedAt=step.status==="Done"?NOW():"";if(step.status==="Done"&&tx.pinnedNextStepId===step.id)tx.pinnedNextStepId="";tx.updatedAt=NOW();save();renderTransaction(tx.id)
}
function transactionStatusModal(id){
  const tx=transaction(id);if(!tx)return;
  modal("Update transaction status",`<div class="status-choice-grid">${["Under Contract","At Risk","Clear to Close","Closed","Terminated"].map(status=>`<button class="status-choice ${tx.status===status?"active":""}" data-action="set-transaction-status" data-id="${tx.id}" data-status="${status}"><strong>${status}</strong><span>${status==="Closed"?"Move the client and property to Closed.":status==="Terminated"?"Preserve the file but mark the deal terminated.":status==="Clear to Close"?"Loan/title report the deal ready for final closing.":"Keep working the active checklist."}</span></button>`).join("")}</div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>`)
}
function setTransactionStatus(id,status){
  const tx=transaction(id),c=contact(tx?.contactId);if(!tx)return;
  tx.status=status;tx.updatedAt=NOW();if(status==="Closed")tx.closedAt=NOW();
  if(c)c.stage=status==="Closed"?"Closed":status==="Terminated"?"Lost":"Under Contract";
  const p=transactionProperty(tx);if(p)p.status=status==="Closed"?"Closed":status==="Terminated"?"Prospect":"Under Contract";
  save();closeModal();renderTransaction(id);toast("Transaction updated",status)
}
function terminateTransaction(id){
  if(!confirm("Mark this transaction terminated? The checklist and history will remain available."))return;
  setTransactionStatus(id,"Terminated")
}

function meaningfulDataCount(stateObj){
  if(!stateObj)return 0;
  return ["contacts","properties","communications","tasks","planRuns","automationQueue","transactions"].reduce(
    (sum,key)=>sum+(Array.isArray(stateObj[key])?stateObj[key].length:0),0
  )
}
function setCloudStatus(status,detail=""){
  cloudStatus=status;
  const button=document.getElementById("cloudSyncButton");
  const label=document.getElementById("cloudSyncLabel");
  const dot=document.getElementById("cloudSyncDot");
  const sidebar=document.getElementById("cloudSidebarStatus");
  if(label)label.textContent=status;
  if(sidebar)sidebar.textContent=detail||status;
  if(button){
    button.classList.toggle("synced",status==="Synced");
    button.classList.toggle("syncing",status==="Syncing…");
    button.classList.toggle("offline",status.includes("Offline")||status.includes("error"));
    button.title=detail||status
  }
  if(dot)dot.textContent=status==="Synced"?"✓":status==="Syncing…"?"↻":status.includes("Offline")?"!":"●"
  const settingsStatus=document.getElementById("cloudSettingsStatus");
  if(settingsStatus)settingsStatus.textContent=detail||status
}
function persistLocalSnapshot(){
  const payload=JSON.stringify(db);
  localStorage.setItem(STORAGE_KEY,payload);
  mirrorToIndexedDb(payload);
  renderNav();
  renderPip();
  setCloudStatus(cloudStatus,cloudUser?`${cloudUser.email||"Signed in"} • ${cloudStatus}`:cloudStatus)
}
function scheduleCloudSave(delay=700){
  if(!cloudReady||!cloudUser||cloudApplying)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>pushCloudState(),delay)
}
async function pushCloudState({force=false}={}){
  if(!cloudClient||!cloudUser||cloudSaving||(!cloudReady&&!force))return false;
  cloudSaving=true;setCloudStatus("Syncing…","Saving changes to the cloud");
  try{
    const revision=Math.max(Number(db.settings.cloudRevision||0)+1,1);
    const updatedAt=NOW();
    const snapshot=JSON.parse(JSON.stringify(db));
    snapshot.settings={
      ...snapshot.settings,
      cloudUserId:cloudUser.id,
      cloudRevision:revision,
      cloudUpdatedAt:updatedAt,
      cloudEmail:cloudUser.email||""
    };
    const {error}=await cloudClient.from(CLOUD_TABLE).upsert({
      user_id:cloudUser.id,
      state:snapshot,
      revision,
      updated_at:updatedAt
    },{onConflict:"user_id"});
    if(error)throw error;
    db=normalize(snapshot);
    cloudReady=true;
    persistLocalSnapshot();
    setCloudStatus("Synced",`Saved ${dateTimeLabel(updatedAt)} • ${cloudUser.email||""}`);
    return true
  }catch(error){
    console.error("Cloud save failed",error);
    setCloudStatus(navigator.onLine?"Sync error":"Offline — saved locally",error.message||"Cloud save failed");
    return false
  }finally{cloudSaving=false}
}
function applyCloudRow(row,{announce=true}={}){
  if(!row?.state)return;
  cloudApplying=true;
  try{
    db=normalize(row.state);
    db.settings.cloudUserId=cloudUser.id;
    db.settings.cloudRevision=Number(row.revision||0);
    db.settings.cloudUpdatedAt=row.updated_at||NOW();
    db.settings.cloudEmail=cloudUser.email||"";
    cloudReady=true;
    persistLocalSnapshot();
    route();
    if(announce)toast("Cloud data loaded",`${db.contacts.length} contacts are available on this device.`);
    setCloudStatus("Synced",`Loaded ${dateTimeLabel(row.updated_at)} • ${cloudUser.email||""}`)
  }finally{cloudApplying=false}
}
function newerRecord(a,b){
  const fields=["updatedAt","date","createdAt","completedAt","sentAt","startedAt"];
  const aTime=fields.map(f=>a?.[f]).find(Boolean)||"";
  const bTime=fields.map(f=>b?.[f]).find(Boolean)||"";
  return String(bTime)>String(aTime)?b:a
}
function mergeCollection(localItems=[],cloudItems=[]){
  const map=new Map();
  [...cloudItems,...localItems].forEach(item=>{
    if(!item?.id)return;
    map.set(item.id,map.has(item.id)?newerRecord(map.get(item.id),item):item)
  });
  return [...map.values()]
}
function mergeStates(localState,cloudState){
  const merged=normalize(cloudState||{});
  const local=normalize(localState||{});
  ["contacts","properties","communications","tasks","planRuns","automationRules","actionPlans","automationQueue","automationLogs","templates","deletedContacts","workHistory","callScripts","transactions","transactionResources"].forEach(key=>{
    merged[key]=mergeCollection(local[key],merged[key])
  });
  merged.automationHistory=[...new Set([...(merged.automationHistory||[]),...(local.automationHistory||[])])].slice(-5000);
  merged.workSnoozes={...(merged.workSnoozes||{}),...(local.workSnoozes||{})};
  merged.scriptDrafts={...(merged.scriptDrafts||{}),...(local.scriptDrafts||{})};
  const localSaved=local.settings?.lastSavedAt||"",cloudSaved=merged.settings?.lastSavedAt||"";
  merged.settings={...(cloudSaved>=localSaved?local.settings:merged.settings),...(cloudSaved>=localSaved?merged.settings:local.settings)};
  return normalize(merged)
}
function showCloudConflict(row){
  pendingCloudRow=row;
  const cloudState=normalize(row.state||{});
  modal("Choose the first cloud copy",`<div class="cloud-conflict">
    <h3>This device and the cloud both contain CRM data.</h3>
    <p>Nothing will be deleted until you choose. The safest option is <strong>Merge both</strong>.</p>
    <div class="cloud-copy-grid">
      <div><label>This device</label><strong>${db.contacts.length} contacts</strong><span>${meaningfulDataCount(db)} total records</span></div>
      <div><label>Cloud</label><strong>${cloudState.contacts.length} contacts</strong><span>${meaningfulDataCount(cloudState)} total records</span></div>
    </div>
  </div>`,`<button class="ghost-btn" data-action="cloud-use-remote">Use cloud</button><button class="ghost-btn" data-action="cloud-use-local">Use this device</button><button class="primary-btn" data-action="cloud-merge">Merge both</button>`)
}
async function pullCloudState({force=false,announce=false}={}){
  if(!cloudClient||!cloudUser)return false;
  setCloudStatus("Syncing…","Checking the cloud");
  try{
    const {data,error}=await cloudClient.from(CLOUD_TABLE)
      .select("state,revision,updated_at")
      .eq("user_id",cloudUser.id)
      .maybeSingle();
    if(error)throw error;
    if(!data){
      cloudReady=true;
      return await pushCloudState({force:true})
    }
    const localCount=meaningfulDataCount(db),cloudState=normalize(data.state||{}),cloudCount=meaningfulDataCount(cloudState);
    const linked=db.settings.cloudUserId===cloudUser.id;
    const localRevision=Number(db.settings.cloudRevision||0),remoteRevision=Number(data.revision||0);
    if(force){
      applyCloudRow(data,{announce});return true
    }
    if(!cloudCount&&localCount){
      cloudReady=true;return await pushCloudState({force:true})
    }
    if(cloudCount&&!localCount){
      applyCloudRow(data,{announce:true});return true
    }
    if(!cloudCount&&!localCount){
      applyCloudRow(data,{announce:false});return true
    }
    if(linked){
      if(remoteRevision>localRevision)applyCloudRow(data,{announce});
      else if(localRevision>remoteRevision){cloudReady=true;await pushCloudState({force:true})}
      else{cloudReady=true;setCloudStatus("Synced",`Up to date • ${cloudUser.email||""}`)}
      return true
    }
    showCloudConflict(data);
    return false
  }catch(error){
    console.error("Cloud load failed",error);
    setCloudStatus(navigator.onLine?"Sync error":"Offline — using device copy",error.message||"Cloud load failed");
    return false
  }
}
function subscribeToCloud(){
  if(!cloudClient||!cloudUser)return;
  if(cloudSubscription)cloudClient.removeChannel(cloudSubscription);
  cloudSubscription=cloudClient.channel(`crm-${cloudUser.id}`)
    .on("postgres_changes",{
      event:"UPDATE",schema:"public",table:CLOUD_TABLE,filter:`user_id=eq.${cloudUser.id}`
    },payload=>{
      if(cloudSaving||cloudApplying)return;
      const incoming=payload.new;
      if(Number(incoming?.revision||0)>Number(db.settings.cloudRevision||0))applyCloudRow(incoming,{announce:false})
    }).subscribe()
}
function showAuthScreen(message=""){
  const screen=document.getElementById("cloudAuthScreen");
  if(screen)screen.classList.add("open");
  const status=document.getElementById("cloudAuthStatus");
  if(status)status.textContent=message;
  setCloudStatus("Sign in to sync","Same contacts on phone and computer")
}
function hideAuthScreen(){
  document.getElementById("cloudAuthScreen")?.classList.remove("open")
}
function authFields(){
  return {
    email:document.getElementById("cloudAuthEmail")?.value.trim()||"",
    password:document.getElementById("cloudAuthPassword")?.value||""
  }
}
async function cloudSignIn(){
  if(!cloudClient)return showAuthScreen("Cloud client did not load. Refresh the page.");
  const {email,password}=authFields();
  if(!email||!password)return showAuthScreen("Enter your email and password.");
  showAuthScreen("Signing in…");
  const {error}=await cloudClient.auth.signInWithPassword({email,password});
  if(error)showAuthScreen(error.message)
}
async function cloudSignUp(){
  if(!cloudClient)return showAuthScreen("Cloud client did not load. Refresh the page.");
  const {email,password}=authFields();
  if(!email||password.length<6)return showAuthScreen("Use a valid email and a password with at least 6 characters.");
  showAuthScreen("Creating your CRM login…");
  const {data,error}=await cloudClient.auth.signUp({email,password});
  if(error)return showAuthScreen(error.message);
  if(!data.session)showAuthScreen("Account created. Check your email to confirm it, then return here and sign in.");
}
async function cloudResetPassword(){
  if(!cloudClient)return;
  const email=authFields().email;
  if(!email)return showAuthScreen("Enter your email first.");
  const redirectTo=`${location.origin}${location.pathname}`;
  const {error}=await cloudClient.auth.resetPasswordForEmail(email,{redirectTo});
  showAuthScreen(error?error.message:"Password-reset email sent.")
}
async function cloudSignOut(){
  if(!cloudClient)return;
  await cloudClient.auth.signOut();
}
async function handleCloudSession(session){
  cloudSession=session||null;cloudUser=session?.user||null;
  if(!cloudUser){
    cloudReady=false;
    if(cloudSubscription){cloudClient?.removeChannel(cloudSubscription);cloudSubscription=null}
    showAuthScreen();
    return
  }
  hideAuthScreen();
  setCloudStatus("Syncing…",`Signing in as ${cloudUser.email||""}`);
  await pullCloudState();
  subscribeToCloud()
}
async function initCloud(){
  if(cloudInitialized)return;
  cloudInitialized=true;
  if(!cloudClient){
    showAuthScreen("Cloud configuration is missing.");
    return
  }
  cloudClient.auth.onAuthStateChange((event,session)=>{
    setTimeout(()=>handleCloudSession(session),0)
  });
  const {data,error}=await cloudClient.auth.getSession();
  if(error)showAuthScreen(error.message);
  else await handleCloudSession(data.session)
}
function cloudSettingsHtml(){
  const signedIn=Boolean(cloudUser);
  return `<section class="setting-card cloud-setting-card"><h3>Cloud sync</h3>
    <p>${signedIn?`Signed in as <strong>${esc(cloudUser.email||"")}</strong>. Changes sync between your phone and computer.`:"Sign in to use the same CRM on every device."}</p>
    <div class="cloud-settings-status"><span id="cloudSettingsStatus">${esc(cloudStatus)}</span><small>${db.settings.cloudUpdatedAt?`Last cloud save: ${dateTimeLabel(db.settings.cloudUpdatedAt)}`:"No cloud save yet"}</small></div>
    <div class="setting-actions">${signedIn?`<button class="primary-btn compact" data-action="cloud-sync-now">Sync now</button><button class="ghost-btn compact" data-action="cloud-pull-now">Reload cloud</button><button class="ghost-btn compact" data-action="cloud-sign-out">Sign out</button>`:`<button class="primary-btn compact" data-action="cloud-open-login">Sign in</button>`}</div>
  </section>`
}

function save(evaluate=true){
  ensureStructuredProperties();
  db.settings.lastSavedAt=NOW();
  persistLocalSnapshot();
  if(evaluate)scheduleAutomationEvaluation();
  scheduleCloudSave();
}
function openBackupDb(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
    const request=indexedDB.open("HoltonHomesCRMBackup",1);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains("snapshots"))database.createObjectStore("snapshots")
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error)
  })
}
async function mirrorToIndexedDb(payload){
  try{
    const database=await openBackupDb();
    const tx=database.transaction("snapshots","readwrite");
    tx.objectStore("snapshots").put(payload,"latest")
  }catch(error){console.warn("Browser backup mirror failed",error)}
}
async function restoreFromIndexedDbIfNeeded(){
  if(localStorage.getItem(STORAGE_KEY))return;
  try{
    const database=await openBackupDb();
    const tx=database.transaction("snapshots","readonly");
    const request=tx.objectStore("snapshots").get("latest");
    request.onsuccess=()=>{
      if(!request.result)return;
      try{
        db=normalize(JSON.parse(request.result));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
        toast("Emergency recovery","Recovered your CRM from its second browser copy.");
        route()
      }catch(error){console.warn("Emergency recovery failed",error)}
    }
  }catch(error){console.warn("No browser recovery copy found",error)}
}
function backupAgeDays(){
  return db.settings.lastManualBackupAt?daysSince(db.settings.lastManualBackupAt):999
}
function backupWarningHtml(){
  const limit=cloudReady?30:7;
  if(backupAgeDays()<=limit)return "";
  return `<section class="backup-alert">
    <div><strong>Download a safety backup.</strong><span>${cloudReady?"Your CRM is syncing to the cloud, but a monthly JSON export is still smart.":"This device is not cloud-synced yet. Download a backup before clearing browser data."}</span></div>
    <button class="backup-button" data-action="export-json">Download backup</button>
  </section>`
}
function normalize(raw){
  const contacts=(raw.contacts||raw.people||[]).map(p=>{
    const parts=String(p.name||"").trim().split(/\s+/);
    const firstName=p.firstName||parts.shift()||"",lastName=p.lastName||parts.join(" ");
    const rawAddress=(p.address&&typeof p.address==="object")?p.address:(p.mailingAddress&&typeof p.mailingAddress==="object")?p.mailingAddress:{};
    return {
      id:p.id||uid(),firstName,lastName,name:[firstName,lastName].filter(Boolean).join(" "),
      phone:p.phone||"",email:p.email||"",
      address:{
        type:rawAddress.type||p.addressType||"Home",
        street:rawAddress.street||p.addressStreet||"",
        unit:rawAddress.unit||p.addressUnit||"",
        city:rawAddress.city||p.addressCity||"",
        state:rawAddress.state||p.addressState||"OH",
        zip:rawAddress.zip||p.addressZip||"",
        county:rawAddress.county||p.addressCounty||"",
        sameAsPrimaryProperty:Boolean(rawAddress.sameAsPrimaryProperty||p.addressSameAsPrimaryProperty)
      },
      type:p.type||"Seller",stage:p.stage||"New",heat:p.heat||"Warm",
      timeframe:p.timeframe||"Unknown",followUp:p.followUp||"",lastCommunication:p.lastCommunication||p.lastContact||"",
      source:p.source||"Sphere",gci:Number(p.gci||0),property:p.property||"",tags:Array.isArray(p.tags)?p.tags:[],
      notes:p.notes||"",createdAt:p.createdAt||TODAY(),updatedAt:p.updatedAt||TODAY(),
      household:Array.isArray(p.household)?p.household.map(member=>({
        id:member.id||uid(),
        relationship:member.relationship||member.type||"Spouse / Partner",
        firstName:member.firstName||String(member.name||"").trim().split(/\s+/)[0]||"",
        lastName:member.lastName||String(member.name||"").trim().split(/\s+/).slice(1).join(" ")||"",
        phone:member.phone||"",
        email:member.email||"",
        decisionMaker:member.decisionMaker!==false,
        anniversary:member.anniversary||"",
        birthday:member.birthday||"",
        notes:member.notes||"",
        linkedContactId:member.linkedContactId||""
      })):[],
      preferences:p.preferences||{areas:"",minPrice:"",maxPrice:"",beds:"",baths:""},
      sellerDetails:p.sellerDetails||{motivation:"",estimatedValue:"",mortgageBalance:"",condition:"",decisionMakers:""},
      buyerDetails:p.buyerDetails||{preapproval:"Unknown",lender:"",budget:"",desiredPayment:"",areas:"",beds:"",baths:"",leaseExpiration:""},
      sphereDetails:p.sphereDetails||{relationship:"",birthday:"",neighborhood:"",homeowner:"Unknown",likelyOpportunity:""},
      professionalDetails:p.professionalDetails||{company:"",role:"",licenseNumber:"",serviceArea:"",specialties:"",referralNotes:""},
      cleanupSnoozedUntil:p.cleanupSnoozedUntil||"",
      alertSettings:p.alertSettings||{propertyAlert:false,marketSnapshot:false,criteria:"",frequency:"Weekly",lastSent:""},
      behaviors:Array.isArray(p.behaviors)?p.behaviors:[]
    }
  });
  const properties=(Array.isArray(raw.properties)?raw.properties:[]).map(p=>({
    id:p.id||uid(),contactId:p.contactId||"",role:p.role||"Seller Property",status:p.status||"Prospect",
    primary:p.primary!==false,street:p.street||"",unit:p.unit||"",city:p.city||"",state:p.state||"OH",
    zip:p.zip||"",county:p.county||"",propertyType:p.propertyType||"Single Family",
    beds:p.beds||"",baths:p.baths||"",sqft:p.sqft||"",acres:p.acres||"",yearBuilt:p.yearBuilt||"",
    occupancy:p.occupancy||"Unknown",ownership:p.ownership||"Unknown",
    estimatedValue:Number(p.estimatedValue||0),mortgageBalance:Number(p.mortgageBalance||0),
    listPrice:Number(p.listPrice||0),expectedSalePrice:Number(p.expectedSalePrice||0),
    targetDate:p.targetDate||"",appointmentDate:p.appointmentDate||"",condition:p.condition||"",
    motivation:p.motivation||"",notes:p.notes||"",createdAt:p.createdAt||TODAY(),updatedAt:p.updatedAt||TODAY()
  }));
  contacts.forEach(c=>{
    if(properties.some(p=>p.contactId===c.id))return;
    if(!c.property||!["Seller","Past Client"].includes(c.type))return;
    properties.push({
      id:uid(),contactId:c.id,role:c.type==="Seller"?"Seller Property":"Past Client Home",
      status:c.stage==="Closed"?"Closed":"Prospect",primary:true,street:c.property,unit:"",city:"",
      state:"OH",zip:"",county:"",propertyType:"Single Family",beds:"",baths:"",sqft:"",acres:"",
      yearBuilt:"",occupancy:"Unknown",ownership:"Unknown",
      estimatedValue:Number(c.sellerDetails?.estimatedValue||0),
      mortgageBalance:Number(c.sellerDetails?.mortgageBalance||0),listPrice:0,expectedSalePrice:0,
      targetDate:"",appointmentDate:"",condition:c.sellerDetails?.condition||"",
      motivation:c.sellerDetails?.motivation||"",notes:"Migrated from the earlier contact property field.",
      createdAt:c.createdAt||TODAY(),updatedAt:TODAY()
    })
  });

  contacts.forEach(c=>{
    const hasStored=Boolean(c.address?.street||c.address?.city||c.address?.zip);
    if(hasStored)return;
    if(!["Seller","Past Client"].includes(c.type))return;
    const p=properties.find(property=>property.contactId===c.id&&property.primary)||properties.find(property=>property.contactId===c.id);
    if(p?.street){
      c.address=addressFromProperty(p,c.address||{});
      c.address.sameAsPrimaryProperty=true
    }
  });

  const communications=(raw.communications||raw.activities||[]).map(a=>({
    id:a.id||uid(),contactId:a.contactId||a.personId||"",channel:a.channel||a.type||"Note",
    direction:a.direction||"outbound",outcome:a.outcome||"",body:a.body||a.summary||"",date:a.date?.includes("T")?a.date:`${a.date||TODAY()}T12:00:00`,
    unread:Boolean(a.unread),threadStatus:a.threadStatus||"open",scriptId:a.scriptId||"",createdAt:a.createdAt||NOW()
  }));
  const tasks=(raw.tasks||[]).map(t=>({id:t.id||uid(),contactId:t.contactId||t.personId||"",title:t.title||"Follow up",type:t.type||"Follow Up",due:t.due||TODAY(),status:t.status||"Open",priority:t.priority||"Normal",planRunId:t.planRunId||"",completedAt:t.completedAt||"",createdAt:t.createdAt||TODAY()}));
  const planRuns=(raw.planRuns||[]).map(r=>({...r,id:r.id||uid(),status:r.status||"Active",startedAt:r.startedAt||TODAY(),stepStates:r.stepStates||{},sourceRuleId:r.sourceRuleId||"",completedAt:r.completedAt||""}));
  const automationRules=Array.isArray(raw.automationRules)?raw.automationRules:defaultAutomationRules.map(rule=>JSON.parse(JSON.stringify(rule)));
  const actionPlans=Array.isArray(raw.actionPlans)?raw.actionPlans:[];
  const automationQueue=Array.isArray(raw.automationQueue)?raw.automationQueue:[];
  const automationLogs=Array.isArray(raw.automationLogs)?raw.automationLogs:[];
  const automationHistory=Array.isArray(raw.automationHistory)?raw.automationHistory:[];
  const templates=(Array.isArray(raw.templates)&&raw.templates.length?raw.templates:defaultTemplates).map(t=>({
    id:t.id||uid(),name:t.name||"Message template",channel:t.channel||"Text",category:t.category||"General",
    subject:t.subject||"",body:t.body||""
  }));
  const deletedContacts=Array.isArray(raw.deletedContacts)?raw.deletedContacts:[];
  const workSnoozes=raw.workSnoozes&&typeof raw.workSnoozes==="object"?raw.workSnoozes:{};
  const workHistory=Array.isArray(raw.workHistory)?raw.workHistory:[];
  const callScripts=(Array.isArray(raw.callScripts)&&raw.callScripts.length?raw.callScripts:defaultCallScripts).map(s=>({
    id:s.id||uid(),name:s.name||"Call script",category:s.category||"General",goal:s.goal||"",
    opener:s.opener||"",questions:Array.isArray(s.questions)?s.questions:[],
    close:s.close||"",voicemail:s.voicemail||"",afterVoicemailText:s.afterVoicemailText||"",
    objections:Array.isArray(s.objections)?s.objections.map(o=>({label:o.label||"Objection",response:o.response||""})):[]
  }));
  const scriptDrafts=raw.scriptDrafts&&typeof raw.scriptDrafts==="object"?raw.scriptDrafts:{};
  const transactionResources=(Array.isArray(raw.transactionResources)&&raw.transactionResources.length?raw.transactionResources:defaultTransactionResources).map(resource=>({
    id:resource.id||uid(),name:resource.name||"Transaction resource",category:resource.category||"Work Portal",
    url:resource.url||"",official:Boolean(resource.official),notes:resource.notes||""
  }));
  defaultTransactionResources.filter(resource=>resource.official&&!transactionResources.some(item=>item.id===resource.id)).forEach(resource=>transactionResources.push({...resource}));
  const transactions=(Array.isArray(raw.transactions)?raw.transactions:[]).map(normalizeTransaction);
  contacts.filter(c=>["Buyer","Seller"].includes(c.type)&&c.stage==="Under Contract"&&!transactions.some(tx=>tx.contactId===c.id&&!["Closed","Terminated"].includes(tx.status))).forEach(c=>{const tx=blankTransaction(c.id,c.type),p=properties.find(item=>item.contactId===c.id&&item.primary)||properties.find(item=>item.contactId===c.id);if(p){tx.propertyId=p.id;Object.assign(tx,{street:p.street,unit:p.unit,city:p.city,state:p.state,zip:p.zip,county:p.county,purchasePrice:Number(p.expectedSalePrice||p.listPrice||0)})}tx.gci=c.gci;buildTransactionChecklist(tx,false);transactions.push(tx)});
  return {contacts,properties,communications,tasks,planRuns,automationRules,actionPlans,automationQueue,automationLogs,automationHistory,templates,deletedContacts,workSnoozes,workHistory,callScripts,scriptDrafts,transactions,transactionResources,settings:{agentName:"Jacob",agentEmail:"",agentPhone:"",commissionRate:3,lastManualBackupAt:"",lastSavedAt:"",annualGciTarget:100000,sellerShareGoal:60,dailyConversationTarget:5,coreMarkets:"Cincinnati, Brown County, Mt. Orab, Williamsburg, Hillsboro, Lebanon",callQueueResumeContactId:"",...(raw.settings||{})}};
}
function loadDatabase(){
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(current)return normalize(JSON.parse(current));
    for(const key of LEGACY_KEYS){
      const legacy=localStorage.getItem(key);
      if(legacy){
        const migrated=normalize(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        return migrated;
      }
    }
  }catch(error){console.warn("Database load failed",error)}
  return normalize({contacts:[],properties:[],communications:[],tasks:[],planRuns:[],automationRules:defaultAutomationRules,actionPlans:[],automationQueue:[],automationLogs:[],automationHistory:[],templates:defaultTemplates,deletedContacts:[],workSnoozes:{},workHistory:[],callScripts:defaultCallScripts,scriptDrafts:{},transactions:[],transactionResources:defaultTransactionResources,settings:{}});
}

function route(){
  const hash=(location.hash||"#/today").replace(/^#\//,"");
  const [name,id]=hash.split("/");
  state.route=name||"today";
  renderNav();
  if(name==="contact"&&id)return renderContact(id);
  if(name==="transaction"&&id)return renderTransaction(id);
  const renderers={today:renderToday,inbox:renderInbox,people:renderPeople,"call-queue":renderCallQueue,pipeline:renderPipeline,transactions:renderTransactions,tasks:renderTasks,automations:renderAutomations,activity:renderActivity,reports:renderReports,settings:renderSettings};
  (renderers[state.route]||renderToday)();
}
function renderNav(){
  document.querySelectorAll("[data-route]").forEach(a=>a.classList.toggle("active",a.dataset.route===state.route||(state.route==="contact"&&a.dataset.route==="people")));
  const due=dueContacts().length,unread=db.communications.filter(x=>x.unread).length,openTasks=db.tasks.filter(t=>t.status!=="Done"&&t.due<=TODAY()).length,calls=callQueue().length,transactionDeadlines=transactionDeadlineItems().length;
  setCount("navTodayCount",due+openTasks+transactionDeadlines);setCount("navInboxCount",unread);setCount("navTaskCount",openTasks);setCount("navCallCount",calls);setCount("navTransactionCount",transactionDeadlines);setCount("pipNavCount",pipNotices().length)
}
function setCount(id,n){const el=document.getElementById(id);if(!el)return;el.textContent=n||"";el.style.display=n?"grid":"none"}
function pageHead(eyebrow,title,description,actions=""){return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="actions">${actions}</div></div>`}
function avatar(c){return `<span class="avatar" aria-hidden="true">${esc(initials(c))}</span>`}
function contactQuickActions(c,labels=false){return `<div class="row-actions">
<button class="quick call" data-action="quick-launch" data-channel="Call" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>☎${labels?" Call":""}</button>
<button class="quick text" data-action="quick-launch" data-channel="Text" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>✉${labels?" Text":""}</button>
<button class="quick email" data-action="quick-launch" data-channel="Email" data-id="${c.id}" ${hasEmail(c)?"":"disabled"}>@${labels?" Email":""}</button>
<button class="quick script" data-action="show-script" data-id="${c.id}">▤${labels?" Script":""}</button></div>`}
function scoreContact(c){
  let score=0,reasons=[];
  if(hasPhone(c)||hasEmail(c)){score+=10;reasons.push(["Valid contact info",10])}
  const tf={"Now — 0–3 months":22,"3–6 months":15,"6–12 months":8,"12+ months":3,"Unknown":0}[c.timeframe]||0;if(tf){score+=tf;reasons.push(["Timeframe",tf])}
  const heat={Hot:22,Warm:12,Cold:4}[c.heat]||0;score+=heat;reasons.push([`${c.heat} relationship`,heat]);
  const ds=daysSince(c.lastCommunication);const communication=ds<=3?18:ds<=7?12:ds<=14?5:0;if(communication){score+=communication;reasons.push(["Recent communication",communication])}
  const advanced=["Listing Appointment","Listing Agreement Signed","Active Listing","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract"].includes(c.stage)?18:0;if(advanced){score+=advanced;reasons.push(["Pipeline progress",advanced])}
  const recentBehaviors=(c.behaviors||[]).filter(b=>daysSince(b.date)<=14);const high=recentBehaviors.filter(b=>["Saved Property","Repeated Property View","Requested Showing","Home Valuation","Clicked Property Alert"].includes(b.type)).length;const behavior=Math.min(20,high*7);if(behavior){score+=behavior;reasons.push(["High-intent behavior",behavior])}
  return {score:Math.min(100,score),reasons:reasons.sort((a,b)=>b[1]-a[1])}
}
function scoreClass(n){return n>=70?"high":n>=40?"mid":"low"}
function dueContacts(){return db.contacts.filter(c=>isOpen(c)&&c.followUp&&c.followUp<=TODAY())}
function overdueTasks(){return db.tasks.filter(t=>t.status!=="Done"&&t.due<TODAY())}
function callQueue(){
  const taskContacts=db.tasks.filter(t=>t.status!=="Done"&&t.type==="Call"&&t.due<=TODAY()).map(t=>({c:contact(t.contactId),task:t})).filter(x=>x.c&&hasPhone(x.c));
  const ids=new Set(taskContacts.map(x=>x.c.id));
  dueContacts().filter(c=>hasPhone(c)&&!ids.has(c.id)).forEach(c=>taskContacts.push({c,task:null}));
  return taskContacts.sort((a,b)=>{
    const w=x=>(x.c.type==="Seller"?20:0)+(x.c.heat==="Hot"?15:0)+scoreContact(x.c).score;
    return w(b)-w(a)
  })
}
function bestNext(){
  const txDeadline=transactionDeadlineItems()[0];if(txDeadline)return {title:txDeadline.step.title,detail:`${transactionAddress(txDeadline.tx)||"Transaction"} • ${txDeadline.step.status==="Problem"?"problem flagged":txDeadline.step.due<TODAY()?"overdue":"due today"}`,route:`#/transaction/${txDeadline.tx.id}`,action:"Open transaction"};
  const hotSeller=dueContacts().filter(c=>c.type==="Seller"&&c.heat==="Hot").sort((a,b)=>scoreContact(b).score-scoreContact(a).score)[0];
  if(hotSeller)return {title:`Call ${fullName(hotSeller)}`,detail:"Your highest-value due seller relationship is waiting.",route:`#/contact/${hotSeller.id}`,action:"Open seller"};
  const unread=db.communications.find(x=>x.unread);
  if(unread){const c=contact(unread.contactId);return {title:`Reply to ${c?fullName(c):"an unread conversation"}`,detail:"Inbox zero protects response time and relationships.",route:"#/inbox",action:"Open inbox"}}
  const due=dueContacts()[0];if(due)return {title:`Follow up with ${fullName(due)}`,detail:"The next step already exists—complete it.",route:`#/contact/${due.id}`,action:"Open contact"};
  const over=overdueTasks()[0];if(over)return {title:over.title,detail:"Finish the overdue commitment before adding more work.",route:"#/tasks",action:"Open tasks"};
  if(!db.contacts.length)return {title:"Add the first 10 people you genuinely know",detail:"A useful CRM begins with real relationships, not empty dashboards.",route:"#/people",action:"Add people"};
  return {title:"Build the next seller conversation",detail:"Your urgent queue is clear. Add, call, or revisit a homeowner relationship.",route:"#/people",action:"Open leads"}
}


function goalMetrics(){
  const closed=db.contacts.filter(c=>c.stage==="Closed");
  const closedGci=closed.reduce((sum,c)=>sum+c.gci,0);
  const target=Number(db.settings.annualGciTarget||100000);
  const sellers=db.contacts.filter(c=>c.type==="Seller").length;
  const leadTotal=db.contacts.filter(c=>["Seller","Buyer"].includes(c.type)).length;
  const sellerShare=leadTotal?Math.round(sellers/leadTotal*100):0;
  const communicationsToday=db.communications.filter(m=>String(m.date).slice(0,10)===TODAY()).length;
  return {closedGci,target,gciPct:Math.min(100,target?Math.round(closedGci/target*100):0),sellerShare,communicationsToday}
}
function holtonPlanHtml(){
  const g=goalMetrics(),target=Number(db.settings.dailyConversationTarget||5);
  const sellerCalls=db.communications.filter(m=>String(m.date).slice(0,10)===TODAY()&&contact(m.contactId)?.type==="Seller").length;
  const followUpsDone=db.tasks.filter(t=>t.completedAt===TODAY()&&["Follow Up","Call","Text","Email"].includes(t.type)).length;
  return `<section class="holton-plan card card-pad">
    <div class="card-head"><div><h2>This week</h2><small>Your activity and pipeline at a glance.</small></div><span class="market-pill">${esc(db.settings.coreMarkets||"Your market")}</span></div>
    <div class="goal-grid">
      <div class="goal-box"><label>Conversations today</label><strong>${g.communicationsToday}/${target}</strong><div class="goal-track"><span style="width:${Math.min(100,g.communicationsToday/Math.max(1,target)*100)}%"></span></div></div>
      <div class="goal-box"><label>Seller conversations</label><strong>${sellerCalls}</strong><small>Seller conversations logged</small></div>
      <div class="goal-box"><label>Follow-ups completed</label><strong>${followUpsDone}</strong><small>Completed follow-ups</small></div>
      
      <div class="goal-box"><label>Closed GCI</label><strong>${money(g.closedGci)}</strong><div class="goal-track"><span style="width:${g.gciPct}%"></span></div><small>${g.gciPct}% of ${money(g.target)}</small></div>
    </div>
    </section>`
}

function renderToday(){
  const open=db.contacts.filter(isOpen),sellers=open.filter(c=>c.type==="Seller"),buyers=open.filter(c=>c.type==="Buyer"),due=dueContacts(),unread=db.communications.filter(x=>x.unread),openTasks=db.tasks.filter(t=>t.status!=="Done"),gci=open.reduce((sum,c)=>sum+c.gci,0),next=bestNext();
  const queue=[...due].sort((a,b)=>(b.type==="Seller")-(a.type==="Seller")||scoreContact(b).score-scoreContact(a).score).slice(0,7);
  document.getElementById("view").innerHTML=
    backupWarningHtml() +
    pageHead("",`Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${db.settings.agentName||"Jacob"}`,"Here is what needs your attention today.","") +
    `<section class="focus-card"><div><label>NEXT UP</label><h2>${esc(next.title)}</h2><p>${esc(next.detail)}</p></div><a class="primary-btn" href="${next.route}">${esc(next.action)} →</a></section>
    ${workQueueHtml()}
    ${holtonPlanHtml()}
    <section class="metric-grid">
      <div class="metric"><label>New leads</label><strong>${untouchedLeads().length}</strong><small>No communication logged yet</small></div>
      <div class="metric"><label>Follow-ups</label><strong>${due.length}</strong><small>Due today or overdue</small></div>
      <div class="metric"><label>Unread</label><strong>${unread.length}</strong><small>Unread conversations</small></div>
      <div class="metric"><label>Hot seller leads</label><strong>${sellers.filter(c=>c.heat==="Hot").length}</strong><small>Seller leads marked hot</small></div>
      <div class="metric"><label>Active buyer leads</label><strong>${buyers.filter(c=>!["New","Attempted Contact","Contacted","Nurture"].includes(c.stage)).length}</strong><small>Consultation stage or later</small></div>
      <div class="metric"><label>Estimated from open opportunities GCI</label><strong>${money(gci)}</strong><small>Estimated from open opportunities</small></div>
    </section>
    <div class="grid two">
      <section class="card"><div class="card-pad card-head"><div><h2>Leads needing attention</h2><small>Sorted by urgency, stage, and last communication.</small></div><a class="ghost-btn compact" href="#/people">All people</a></div>
        <div class="queue">${queue.length?queue.map(c=>queueRow(c)).join(""):`<div class="empty">Your follow-up list is clear. Create a seller conversation.</div>`}</div>
      </section>
      <section class="grid">
        <div class="card card-pad"><div class="card-head"><div><h2>Recent lead activity</h2><small>Saved homes, repeat views, valuations, and showing requests.</small></div><a class="ghost-btn compact" href="#/activity">All activity</a></div>${behaviorAlertsHtml(5)}</div>
        <div class="card card-pad"><div class="card-head"><div><h2>Tasks</h2><small>Calls and follow-ups waiting for you.</small></div></div>
          <div class="queue">
            <div class="queue-row"><span class="avatar">☎</span><div><strong>Call Queue</strong><small>${callQueue().length} due calls ready</small></div><a class="ghost-btn compact" href="#/call-queue">Start</a></div>
            <div class="queue-row"><span class="avatar">✓</span><div><strong>Open tasks</strong><small>${openTasks.length} actions waiting</small></div><a class="ghost-btn compact" href="#/tasks">Work</a></div>
          </div>
        </div>
      </section>
    </div>`;
}
function queueRow(c){
  const s=scoreContact(c);return `<div class="queue-row">${avatar(c)}<div><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.type)} • ${esc(c.stage)} • ${c.followUp?`Follow up ${dateLabel(c.followUp)}`:"No next step"} • Score ${s.score}</small></div>${contactQuickActions(c)}</div>`
}
function behaviorAlerts(){
  const alerts=[];
  db.contacts.forEach(c=>(c.behaviors||[]).forEach(b=>{
    const weight={"Requested Showing":100,"Home Valuation":95,"Repeated Property View":80,"Saved Property":70,"Clicked Property Alert":60}[b.type]||0;
    if(weight&&daysSince(b.date)<=30)alerts.push({c,b,weight})
  }));
  return alerts.sort((a,b)=>b.weight-a.weight||String(b.b.date).localeCompare(String(a.b.date)))
}
function behaviorAlertsHtml(limit=10){
  const alerts=behaviorAlerts().slice(0,limit);
  return alerts.length?`<div class="queue">${alerts.map(({c,b})=>`<div class="queue-row"><span class="avatar">◉</span><div><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(b.type)}${b.property?` • ${esc(b.property)}`:""} • ${dateLabel(b.date)}</small></div><button class="quick call" data-action="communicate" data-channel="Call" data-id="${c.id}">Call</button></div>`).join("")}</div>`:`<div class="empty">No high-intent website activity logged yet.</div>`
}


function cleanupIssues(c){
  const issues=[];
  if(!hasPhone(c)&&!hasEmail(c))issues.push({id:"contact",label:"Phone or email missing"});
  if(!contactAddressComplete(c))issues.push({id:"contactAddress",label:"Contact address incomplete"});
  if(!c.followUp&&isOpen(c))issues.push({id:"followup",label:"Next follow-up missing"});
  if(c.timeframe==="Unknown"&&["Seller","Buyer"].includes(c.type))issues.push({id:"timeframe",label:"Timeframe unknown"});
  if(!c.source||c.source==="Other")issues.push({id:"source",label:"Lead source missing"});
  if(c.type==="Seller"){
    const p=primaryProperty(c);
    if(!p?.street||!p?.city||!p?.zip)issues.push({id:"address",label:"Property address incomplete"});
    if(!(p?.motivation||c.sellerDetails?.motivation))issues.push({id:"motivation",label:"Seller motivation missing"});
  }
  if(c.type==="Buyer"){
    if(!(c.buyerDetails?.areas||c.property))issues.push({id:"areas",label:"Target areas missing"});
    if(!(c.buyerDetails?.budget||c.buyerDetails?.desiredPayment))issues.push({id:"budget",label:"Budget or payment missing"});
  }
  return issues
}
function cleanupIsSnoozed(c){
  return Boolean(c.cleanupSnoozedUntil&&c.cleanupSnoozedUntil>TODAY())
}
function cleanupBadges(c){
  const issues=cleanupIssues(c);
  return issues.length?`<div class="cleanup-badges">${issues.slice(0,4).map(issue=>`<span>${esc(issue.label)}</span>`).join("")}${issues.length>4?`<span>＋${issues.length-4} more</span>`:""}</div>`:""
}
function cleanupModal(id){
  const c=contact(id),issues=cleanupIssues(c);if(!c)return;
  const p=primaryProperty(c)||{},a=contactAddressObject(c);
  modal(`Fix record — ${fullName(c)}`,`<div class="cleanup-intro"><strong>${issues.length} item${issues.length===1?"":"s"} need attention</strong><span>Save the missing information and this contact will automatically leave Fix Records.</span></div>
    <div class="form-grid cleanup-form">
      ${issues.some(x=>x.id==="contact")?`<div class="field"><label>Phone</label><input id="cleanupPhone" type="tel" value="${esc(c.phone||"")}"></div><div class="field"><label>Email</label><input id="cleanupEmail" type="email" value="${esc(c.email||"")}"></div>`:""}
      ${issues.some(x=>x.id==="contactAddress")?`<div class="field full section-label">Contact / mailing address</div><div class="field full"><label>Street address</label><input id="cleanupContactStreet" value="${esc(a.street||"")}"></div><div class="field"><label>Unit</label><input id="cleanupContactUnit" value="${esc(a.unit||"")}"></div><div class="field"><label>City</label><input id="cleanupContactCity" value="${esc(a.city||"")}"></div><div class="field"><label>State</label><input id="cleanupContactState" value="${esc(a.state||"OH")}"></div><div class="field"><label>ZIP</label><input id="cleanupContactZip" value="${esc(a.zip||"")}"></div><div class="field"><label>County</label><input id="cleanupContactCounty" value="${esc(a.county||"")}"></div>`:""}
      ${issues.some(x=>x.id==="followup")?`<div class="field"><label>Next follow-up</label><input id="cleanupFollowUp" type="date" value="${addDays(TODAY(),3)}"></div>`:""}
      ${issues.some(x=>x.id==="timeframe")?`<div class="field"><label>Timeframe</label><select id="cleanupTimeframe">${["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"].map(x=>`<option ${c.timeframe===x?"selected":""}>${x}</option>`).join("")}</select></div>`:""}
      ${issues.some(x=>x.id==="source")?`<div class="field"><label>Lead source</label><select id="cleanupSource">${sources.map(x=>`<option ${c.source===x?"selected":""}>${x}</option>`).join("")}</select></div>`:""}
      ${issues.some(x=>x.id==="address")?`<div class="field full"><label>Street address</label><input id="cleanupStreet" value="${esc(p.street||"")}"></div><div class="field"><label>City</label><input id="cleanupCity" value="${esc(p.city||"")}"></div><div class="field"><label>ZIP</label><input id="cleanupZip" value="${esc(p.zip||"")}"></div>`:""}
      ${issues.some(x=>x.id==="motivation")?`<div class="field full"><label>Seller motivation</label><input id="cleanupMotivation" value="${esc(p.motivation||c.sellerDetails?.motivation||"")}"></div>`:""}
      ${issues.some(x=>x.id==="areas")?`<div class="field full"><label>Target areas</label><input id="cleanupAreas" value="${esc(c.buyerDetails?.areas||c.property||"")}"></div>`:""}
      ${issues.some(x=>x.id==="budget")?`<div class="field"><label>Budget</label><input id="cleanupBudget" type="number" value="${esc(c.buyerDetails?.budget||"")}"></div><div class="field"><label>Desired payment</label><input id="cleanupPayment" type="number" value="${esc(c.buyerDetails?.desiredPayment||"")}"></div>`:""}
    </div>`,`<button class="ghost-btn" data-action="snooze-cleanup" data-id="${id}">Snooze 30 days</button><button class="primary-btn" data-action="save-cleanup" data-id="${id}">Save fixes</button>`)
}
function saveCleanup(id){
  const c=contact(id);if(!c)return;
  if(document.getElementById("cleanupPhone"))c.phone=document.getElementById("cleanupPhone").value.trim();
  if(document.getElementById("cleanupEmail"))c.email=document.getElementById("cleanupEmail").value.trim();
  if(document.getElementById("cleanupFollowUp"))c.followUp=document.getElementById("cleanupFollowUp").value;
  if(document.getElementById("cleanupTimeframe"))c.timeframe=document.getElementById("cleanupTimeframe").value;
  if(document.getElementById("cleanupSource"))c.source=document.getElementById("cleanupSource").value;
  if(document.getElementById("cleanupContactStreet")){
    c.address={...contactAddressObject(c),street:document.getElementById("cleanupContactStreet").value.trim(),
      unit:document.getElementById("cleanupContactUnit").value.trim(),city:document.getElementById("cleanupContactCity").value.trim(),
      state:document.getElementById("cleanupContactState").value.trim()||"OH",zip:document.getElementById("cleanupContactZip").value.trim(),
      county:document.getElementById("cleanupContactCounty").value.trim(),sameAsPrimaryProperty:false}
  }
  if(document.getElementById("cleanupAreas")){
    c.buyerDetails={...c.buyerDetails,areas:document.getElementById("cleanupAreas").value.trim()};
    c.property=c.buyerDetails.areas
  }
  if(document.getElementById("cleanupBudget")||document.getElementById("cleanupPayment")){
    c.buyerDetails={...c.buyerDetails,budget:document.getElementById("cleanupBudget")?.value||c.buyerDetails?.budget||"",desiredPayment:document.getElementById("cleanupPayment")?.value||c.buyerDetails?.desiredPayment||""}
  }
  if(document.getElementById("cleanupStreet")){
    let p=primaryProperty(c);
    if(!p){
      p={id:uid(),contactId:c.id,role:"Seller Property",status:"Prospect",primary:true,street:"",unit:"",city:"",state:"OH",zip:"",county:"",propertyType:"Single Family",beds:"",baths:"",sqft:"",acres:"",yearBuilt:"",occupancy:"Unknown",ownership:"Unknown",estimatedValue:0,mortgageBalance:0,listPrice:0,expectedSalePrice:0,targetDate:"",appointmentDate:"",condition:"",motivation:"",notes:"",createdAt:TODAY(),updatedAt:TODAY()};
      db.properties.push(p)
    }
    p.street=document.getElementById("cleanupStreet").value.trim();
    p.city=document.getElementById("cleanupCity").value.trim();
    p.zip=document.getElementById("cleanupZip").value.trim();
    if(document.getElementById("cleanupMotivation"))p.motivation=document.getElementById("cleanupMotivation").value.trim();
    p.updatedAt=TODAY();c.property=propertyAddress(p)
  }else if(document.getElementById("cleanupMotivation")){
    const p=primaryProperty(c);
    const value=document.getElementById("cleanupMotivation").value.trim();
    if(p)p.motivation=value;
    c.sellerDetails={...c.sellerDetails,motivation:value}
  }
  c.cleanupSnoozedUntil="";c.updatedAt=TODAY();
  const remaining=cleanupIssues(c);
  save();closeModal();toast(remaining.length?"Record updated":"Record cleaned",remaining.length?`${remaining.length} item${remaining.length===1?"":"s"} remain.`:"This contact left Fix Records.");renderPeople()
}
function snoozeCleanup(id){
  const c=contact(id);if(!c)return;
  c.cleanupSnoozedUntil=addDays(TODAY(),30);save();closeModal();toast("Cleanup snoozed",`${fullName(c)} will return in 30 days.`);renderPeople()
}


function contactsFromTasks(filter){
  return [...new Set(db.tasks.filter(filter).map(t=>contact(t.contactId)).filter(Boolean))]
}
function possibleDuplicateIds(){
  const ids=new Set();
  duplicateGroups().forEach(group=>group.forEach(c=>ids.add(c.id)));
  return ids
}
function smartLists(){
  const open=db.contacts.filter(isOpen),duplicateIds=possibleDuplicateIds();
  return [
    {id:"all",collection:"Database",name:"All Contacts",description:"Every active contact.",items:db.contacts},
    {id:"replies",collection:"Work Now",name:"Replies Needed",description:"Unread inbound conversations.",items:[...new Set(db.communications.filter(m=>m.unread&&m.direction==="inbound").map(m=>contact(m.contactId)).filter(Boolean))]},
    {id:"untouched",collection:"Work Now",name:"New Leads — No Contact",description:"New seller and buyer leads with no logged personal communication.",items:untouchedLeads()},
    {id:"due",collection:"Work Now",name:"Follow-Ups Due",description:"Next follow-up is today or overdue.",items:dueContacts()},
    {id:"appointments",collection:"Work Now",name:"Appointments This Week",description:"Appointments scheduled during the next seven days.",items:contactsFromTasks(t=>t.status!=="Done"&&t.type==="Appointment"&&t.due>=TODAY()&&t.due<=addDays(TODAY(),7))},
    {id:"deadlines",collection:"Work Now",name:"Transaction Deadlines",description:"Open transaction tasks due during the next seven days.",items:contactsFromTasks(t=>t.status!=="Done"&&t.type==="Transaction"&&t.due<=addDays(TODAY(),7))},
    {id:"stale-hot",collection:"Work Now",name:"Stale Hot Leads",description:"Hot leads without personal communication in three or more days.",items:open.filter(c=>c.heat==="Hot"&&daysSince(c.lastCommunication)>=3)},
    {id:"hot-sellers",collection:"Seller Growth",name:"Hot Sellers — No Appointment",description:"Hot seller opportunities not yet at a listing appointment.",items:open.filter(c=>c.type==="Seller"&&c.heat==="Hot"&&!["Listing Appointment","Listing Agreement Signed","Coming Soon","Active Listing","Offer Received","Under Contract"].includes(c.stage))},
    {id:"valuations",collection:"Seller Growth",name:"Valuations in Progress",description:"Seller leads waiting for valuation delivery or a follow-up conversation.",items:open.filter(c=>c.type==="Seller"&&["Valuation Requested","Valuation Delivered"].includes(c.stage))},
    {id:"listing-appointments",collection:"Seller Growth",name:"Listing Appointments",description:"Seller relationships currently at the listing-appointment stage.",items:open.filter(c=>c.type==="Seller"&&c.stage==="Listing Appointment")},
    {id:"seller-updates",collection:"Seller Growth",name:"Seller Updates Due",description:"Active listings without a logged seller update in seven days.",items:open.filter(c=>c.type==="Seller"&&c.stage==="Active Listing"&&daysSince(c.lastCommunication)>=7)},
    {id:"future-sellers",collection:"Seller Growth",name:"Future Sellers Due",description:"Nurture and follow-up sellers whose next date has arrived.",items:open.filter(c=>c.type==="Seller"&&["Nurture","Follow-Up"].includes(c.stage)&&c.followUp&&c.followUp<=TODAY())},
    {id:"active-buyers",collection:"Buyer Growth",name:"Active Buyers",description:"Buyer consultation through offer stage.",items:open.filter(c=>c.type==="Buyer"&&!["New","Attempted Contact","Contacted","Nurture"].includes(c.stage))},
    {id:"buyer-stale",collection:"Buyer Growth",name:"Active Buyers — 7 Days",description:"Active buyers without personal communication in seven days.",items:open.filter(c=>c.type==="Buyer"&&!["New","Attempted Contact","Contacted","Nurture"].includes(c.stage)&&daysSince(c.lastCommunication)>=7)},
    {id:"past-clients",collection:"Relationships",name:"Past Clients — 90 Days",description:"Past clients without a personal touch in ninety days.",items:db.contacts.filter(c=>c.type==="Past Client"&&daysSince(c.lastCommunication)>=90)},
    {id:"partners",collection:"Relationships",name:"Partners Due",description:"Realtors and lenders without a personal touch in thirty days.",items:db.contacts.filter(c=>["Realtor","Lender"].includes(c.type)&&daysSince(c.lastCommunication)>=30)},
    {id:"missing-next",collection:"Protect the Database",name:"Missing Next Step",description:"Open sellers and buyers without a follow-up date.",items:open.filter(c=>["Seller","Buyer"].includes(c.type)&&!c.followUp)},
    {id:"missing-address",collection:"Protect the Database",name:"Missing Contact Address",description:"People without a complete street, city, state, and ZIP.",items:db.contacts.filter(c=>!contactAddressComplete(c))},
    {id:"cleanup",collection:"Protect the Database",name:"Fix Records",description:"Records missing information required for useful follow-up.",items:open.filter(c=>!cleanupIsSnoozed(c)&&cleanupIssues(c).length)},
    {id:"duplicates",collection:"Protect the Database",name:"Possible Duplicates",description:"Contacts sharing a phone number or email address.",items:db.contacts.filter(c=>duplicateIds.has(c.id))},
    {id:"stale",collection:"Protect the Database",name:"No Contact 14+ Days",description:"Open relationships without personal communication in fourteen days.",items:open.filter(c=>daysSince(c.lastCommunication)>=14)}
  ]
}
function smartListReason(c,listId=state.smartList){
  const list=smartLists().find(x=>x.id===listId);
  if(!list)return "";
  if(listId==="replies"){
    const m=db.communications.filter(x=>x.contactId===c.id&&x.unread).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    return m?`Unread ${m.channel.toLowerCase()} from ${dateTimeLabel(m.date)}`:"Unread reply"
  }
  if(listId==="untouched")return `No communication logged since added ${dateLabel(c.createdAt)}`;
  if(listId==="due")return c.followUp<TODAY()?`Follow-up overdue since ${dateLabel(c.followUp)}`:"Follow-up due today";
  if(listId==="stale-hot")return `Hot lead • ${daysSince(c.lastCommunication)} days since last personal communication`;
  if(listId==="hot-sellers")return `${c.heat} seller • stage is ${c.stage} • no listing appointment`;
  if(listId==="valuations")return `${c.stage} • ${propertyDisplay(c)||"property details needed"}`;
  if(listId==="seller-updates")return `${daysSince(c.lastCommunication)} days since the last seller update`;
  if(listId==="future-sellers")return `${c.stage} seller • follow-up ${dateLabel(c.followUp)}`;
  if(listId==="buyer-stale")return `${daysSince(c.lastCommunication)} days since the last buyer conversation`;
  if(listId==="past-clients")return `${daysSince(c.lastCommunication)} days since the last personal touch`;
  if(listId==="partners")return `${c.type} partner • ${daysSince(c.lastCommunication)} days since last touch`;
  if(listId==="missing-next")return `Open ${c.type.toLowerCase()} with no next follow-up`;
  if(listId==="missing-address")return "Contact / mailing address is incomplete";
  if(listId==="cleanup")return cleanupIssues(c).map(x=>x.label).slice(0,2).join(" • ");
  if(listId==="duplicates")return `Matches ${duplicateMatches(c).map(fullName).join(", ")}`;
  if(listId==="stale")return `${daysSince(c.lastCommunication)} days since last personal communication`;
  if(listId==="appointments"){
    const t=db.tasks.find(t=>t.contactId===c.id&&t.status!=="Done"&&t.type==="Appointment"&&t.due<=addDays(TODAY(),7));
    return t?`${t.title} • ${dateLabel(t.due)}`:"Appointment this week"
  }
  if(listId==="deadlines"){
    const t=db.tasks.find(t=>t.contactId===c.id&&t.status!=="Done"&&t.type==="Transaction"&&t.due<=addDays(TODAY(),7));
    return t?`${t.title} • ${dateLabel(t.due)}`:"Transaction deadline"
  }
  return list.description||""
}

function filteredPeople(){
  const list=smartLists().find(x=>x.id===state.smartList)?.items||db.contacts;
  const q=state.peopleQuery.toLowerCase();
  return list.filter(c=>{
    const blob=[fullName(c),c.phone,c.email,contactAddressDisplay(c),c.address?.county,c.property,propertyDisplay(c),...propertiesForContact(c.id).map(propertyAddress),c.source,...c.tags].join(" ").toLowerCase();
    return (!q||blob.includes(q))&&(!state.peopleType||c.type===state.peopleType)&&(!state.peopleStage||c.stage===state.peopleStage)&&(!state.peopleHeat||c.heat===state.peopleHeat)
  }).sort((a,b)=>(a.followUp||"9999").localeCompare(b.followUp||"9999"))
}

function renderPeople(){
  const lists=smartLists(),people=filteredPeople(),active=lists.find(x=>x.id===state.smartList)||lists[0];
  const collections=[...new Set(lists.map(x=>x.collection))];
  document.getElementById("view").innerHTML=
    pageHead("Relationship database","Leads & Contacts","Work the list, log the conversation, and let the contact leave automatically.",`<button class="primary-btn" data-action="open-contact">＋ New contact</button>`) +
    `<div class="people-layout">
      <aside class="smart-sidebar"><h3>Smart Lists</h3>${collections.map(collection=>`<div class="smart-collection"><label>${esc(collection)}</label>${lists.filter(x=>x.collection===collection).map(x=>`<button class="smart-list-btn ${x.id===state.smartList?"active":""}" data-action="smart-list" data-id="${x.id}" title="${esc(x.description)}"><span>${esc(x.name)}</span><b>${x.items.length}</b></button>`).join("")}</div>`).join("")}</aside>
      <section>
        <div class="active-list-head"><div><span>${esc(active.collection)}</span><h2>${esc(active.name)}</h2><p>${esc(active.description)}</p></div><b>${people.length}</b></div>
        <div class="toolbar">
          <input id="peopleSearch" value="${esc(state.peopleQuery)}" placeholder="Search name, phone, email, contact address, property, source, or tag">
          <select id="peopleType"><option value="">All types</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${state.peopleType===x?"selected":""}>${x}</option>`).join("")}</select>
          <select id="peopleStage"><option value="">All stages</option>${[...new Set([...sellerStages,...buyerStages])].map(x=>`<option ${state.peopleStage===x?"selected":""}>${x}</option>`).join("")}</select>
          <select id="peopleHeat"><option value="">All heat</option>${["Hot","Warm","Cold"].map(x=>`<option ${state.peopleHeat===x?"selected":""}>${x}</option>`).join("")}</select>
          <button class="ghost-btn compact" data-action="clear-people">Clear</button>
        </div>
        <div class="table-wrap desktop-people"><table><thead><tr><th>Person and reason</th><th>Contact Address</th><th>Type</th><th>Stage</th><th>Score</th><th>Last Communication</th><th>Next Follow-Up</th><th>Source</th><th>Open GCI</th><th>Actions</th></tr></thead>
        <tbody>${people.length?people.map(personRow).join(""):`<tr><td colspan="10"><div class="empty">Nobody is on this list right now.</div></td></tr>`}</tbody></table></div>
        <div class="mobile-people">${people.length?people.map(mobilePersonCard).join(""):`<div class="empty">Nobody is on this list right now.</div>`}</div>
      </section>
    </div>`
}
function personRow(c){
  const s=scoreContact(c),reason=smartListReason(c);
  return `<tr>
    <td><a class="contact-cell contact-cell-link" href="#/contact/${c.id}">${avatar(c)}<div><strong>${esc(fullName(c))}</strong><small>${esc(reason||c.phone||c.email||"No contact information")}</small>${renderTagChips(c.tags)}</div></a>${state.smartList==="cleanup"?cleanupBadges(c):""}</td>
    <td class="people-address-cell">${contactAddressDisplay(c)?`<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddressDisplay(c))}">${esc(contactAddressDisplay(c))}</a><small>${esc(contactAddressObject(c).type||"Home")}${contactAddressObject(c).sameAsPrimaryProperty?" • property synced":""}</small>`:`<button class="missing-address-button" data-action="open-contact" data-id="${c.id}">＋ Add address</button>`}</td>
    <td><span class="badge type-${c.type.toLowerCase().replace(" ","-")}">${esc(c.type)}</span></td><td>${esc(c.stage)}</td>
    <td><span class="score ${scoreClass(s.score)}">${s.score}</span></td><td>${c.lastCommunication?dateLabel(c.lastCommunication):"Never"}</td>
    <td class="${c.followUp&&c.followUp<TODAY()?"overdue":""}">${dateLabel(c.followUp)}</td><td>${esc(c.source)}</td><td>${money(c.gci)}</td>
    <td>${contactQuickActions(c)}${state.smartList==="cleanup"?`<button class="quick cleanup-fix" data-action="open-cleanup" data-id="${c.id}">Fix</button>`:""}${state.smartList==="duplicates"?`<button class="quick cleanup-fix" data-action="review-duplicate" data-id="${c.id}">Merge</button>`:""}</td>
  </tr>`
}
function mobilePersonCard(c){
  const s=scoreContact(c),issues=cleanupIssues(c),reason=smartListReason(c);
  return `<article class="mobile-contact-card">
    <a class="mobile-contact-main" href="#/contact/${c.id}">
      ${avatar(c)}
      <div class="mobile-contact-copy">
        <div class="mobile-contact-title"><strong>${esc(fullName(c))}</strong><span class="score ${scoreClass(s.score)}">${s.score}</span></div>
        <span>${esc(c.type)} • ${esc(c.stage)} • ${esc(c.heat)}</span>
        <small>${esc(reason||`${c.lastCommunication?`Last touch ${dateLabel(c.lastCommunication)}`:"Never contacted"} • ${c.followUp?`Next ${dateLabel(c.followUp)}`:"No next step"}`)}</small>
        <small class="mobile-contact-address">${contactAddressDisplay(c)?`⌖ ${esc(contactAddressDisplay(c))}`:"⌖ Contact address missing"}</small>
        ${renderTagChips(c.tags)}
      </div>
    </a>
    ${state.smartList==="cleanup"&&issues.length?cleanupBadges(c):""}
    <div class="mobile-contact-actions">
      ${contactQuickActions(c,true)}
      ${state.smartList==="cleanup"?`<button class="primary-btn compact" data-action="open-cleanup" data-id="${c.id}">Fix</button>`:state.smartList==="duplicates"?`<button class="primary-btn compact" data-action="review-duplicate" data-id="${c.id}">Merge</button>`:`<a class="ghost-btn compact" href="#/contact/${c.id}">Open</a>`}
    </div>
  </article>`
}


function cleanPhone(value){return String(value||"").replace(/\D/g,"").slice(-10)}
function duplicateMatches(c){
  const phone=cleanPhone(c.phone),email=String(c.email||"").trim().toLowerCase();
  return db.contacts.filter(other=>other.id!==c.id&&((phone&&cleanPhone(other.phone)===phone)||(email&&String(other.email||"").trim().toLowerCase()===email)))
}
function duplicateGroups(){
  const seen=new Set(),groups=[];
  db.contacts.forEach(c=>{
    if(seen.has(c.id))return;
    const group=[c,...duplicateMatches(c)].filter((item,index,array)=>array.findIndex(x=>x.id===item.id)===index);
    if(group.length>1){group.forEach(x=>seen.add(x.id));groups.push(group)}
  });
  return groups
}
function duplicateReviewModal(id){
  const c=contact(id),matches=duplicateMatches(c);if(!c||!matches.length)return toast("No duplicate found","This record no longer matches another contact.");
  modal(`Merge duplicates — keep ${fullName(c)}`,`<div class="duplicate-review">
    <p>The selected contact stays as the main profile. Communications, tasks, properties, household members, tags, and notes from the other profile move into it.</p>
    ${matches.map(match=>`<div class="duplicate-option">${avatar(match)}<div><strong>${esc(fullName(match))}</strong><span>${esc(match.phone||"No phone")} • ${esc(match.email||"No email")} • ${esc(match.type)} • ${esc(match.stage)}</span></div><button class="danger-btn compact" data-action="merge-duplicate" data-id="${c.id}" data-merge="${match.id}">Merge into ${esc(c.firstName||"main")}</button></div>`).join("")}
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>`)
}
function mergeContacts(primaryId,secondaryId){
  const primary=contact(primaryId),secondary=contact(secondaryId);if(!primary||!secondary)return;
  if(!confirm(`Merge ${fullName(secondary)} into ${fullName(primary)}? The primary profile will remain.`))return;
  const fillFields=["phone","email","timeframe","followUp","lastCommunication","property","notes"];
  if(!contactAddressComplete(primary)&&contactAddressComplete(secondary))primary.address={...contactAddressObject(secondary),sameAsPrimaryProperty:false};
  fillFields.forEach(field=>{if(!primary[field]&&secondary[field])primary[field]=secondary[field]});
  primary.tags=[...new Set([...(primary.tags||[]),...(secondary.tags||[])])];
  const householdKeys=new Set((primary.household||[]).map(m=>`${cleanPhone(m.phone)}|${String(m.email||"").toLowerCase()}|${householdName(m).toLowerCase()}`));
  (secondary.household||[]).forEach(member=>{
    const key=`${cleanPhone(member.phone)}|${String(member.email||"").toLowerCase()}|${householdName(member).toLowerCase()}`;
    if(!householdKeys.has(key)){primary.household.push(member);householdKeys.add(key)}
  });
  primary.notes=[primary.notes,secondary.notes?`Merged notes from ${fullName(secondary)}:\n${secondary.notes}`:""].filter(Boolean).join("\n\n");
  ["properties","communications","tasks","planRuns","automationQueue","automationLogs","transactions"].forEach(key=>{
    (db[key]||[]).forEach(item=>{if(item.contactId===secondaryId)item.contactId=primaryId})
  });
  db.communications.unshift({id:uid(),contactId:primaryId,channel:"Note",direction:"outbound",outcome:"Duplicate merged",body:`Merged ${fullName(secondary)} into this contact.`,date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});
  db.contacts=db.contacts.filter(x=>x.id!==secondaryId);
  primary.updatedAt=TODAY();save();closeModal();location.hash=`#/contact/${primaryId}`;toast("Contacts merged",`${fullName(secondary)} was combined with ${fullName(primary)}.`)
}
function trashContact(id){
  const c=contact(id);if(!c)return;
  if(!confirm(`Move ${fullName(c)} to Recently Deleted? You can restore the contact from Settings.`))return;
  const snapshot={
    id:uid(),contact:c,
    properties:db.properties.filter(x=>x.contactId===id),
    communications:db.communications.filter(x=>x.contactId===id),
    tasks:db.tasks.filter(x=>x.contactId===id),
    planRuns:db.planRuns.filter(x=>x.contactId===id),
    transactions:db.transactions.filter(x=>x.contactId===id),
    deletedAt:NOW()
  };
  db.deletedContacts.unshift(snapshot);
  db.deletedContacts=db.deletedContacts.slice(0,100);
  db.contacts=db.contacts.filter(x=>x.id!==id);
  db.properties=db.properties.filter(x=>x.contactId!==id);
  db.communications=db.communications.filter(x=>x.contactId!==id);
  db.tasks=db.tasks.filter(x=>x.contactId!==id);
  db.planRuns=db.planRuns.filter(x=>x.contactId!==id);
  db.transactions=db.transactions.filter(x=>x.contactId!==id);
  save();location.hash="#/people";toast("Moved to Recently Deleted",`${fullName(c)} can be restored from Settings.`)
}
function restoreDeleted(id){
  const snapshot=db.deletedContacts.find(x=>x.id===id);if(!snapshot)return;
  if(!db.contacts.some(c=>c.id===snapshot.contact.id))db.contacts.push(snapshot.contact);
  ["properties","communications","tasks","planRuns","transactions"].forEach(key=>{
    const existing=new Set((db[key]||[]).map(x=>x.id));
    (snapshot[key]||[]).forEach(item=>{if(!existing.has(item.id))db[key].push(item)})
  });
  db.deletedContacts=db.deletedContacts.filter(x=>x.id!==id);
  save();renderSettings();toast("Contact restored",fullName(snapshot.contact))
}
function permanentlyDelete(id){
  const snapshot=db.deletedContacts.find(x=>x.id===id);if(!snapshot)return;
  if(!confirm(`Permanently delete ${fullName(snapshot.contact)}? This cannot be undone.`))return;
  db.deletedContacts=db.deletedContacts.filter(x=>x.id!==id);save();renderSettings();toast("Permanently deleted",fullName(snapshot.contact))
}
function templateOptions(channel,c){
  const options=db.templates.filter(t=>t.channel===channel);
  return options.length?`<div class="field full template-picker"><label>Insert template</label><div><select id="commTemplate"><option value="">Choose a template</option>${options.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select><button type="button" class="ghost-btn compact" data-action="apply-message-template" data-contact="${c?.id||""}">Insert</button></div></div>`:""
}
function applyMessageTemplate(contactId){
  const template=db.templates.find(t=>t.id===document.getElementById("commTemplate")?.value),c=contact(contactId||document.getElementById("commContact")?.value);
  if(!template)return;
  const body=document.getElementById("commBody"),subject=document.getElementById("commSubject");
  if(body)body.value=personalizeTemplate(template.body,c);
  if(subject)subject.value=personalizeTemplate(template.subject,c)
}
function templatesSettingsHtml(){
  return `<section class="setting-card template-settings"><div class="setting-card-head"><div><h3>Message templates</h3><p>Reusable texts and emails personalized with contact fields.</p></div><button class="primary-btn compact" data-action="open-template">＋ Add</button></div>
    <div class="template-list">${db.templates.map(t=>`<div class="template-row"><div><strong>${esc(t.name)}</strong><span>${esc(t.channel)} • ${esc(t.category)}</span></div><button class="quick" data-action="open-template" data-id="${t.id}">Edit</button></div>`).join("")}</div>
  </section>`
}
function templateModal(id=""){
  const t=db.templates.find(x=>x.id===id)||{id:"",name:"",channel:"Text",category:"Seller",subject:"",body:""};
  modal(t.id?"Edit template":"New template",`<div class="form-grid">
    <input type="hidden" id="templateId" value="${esc(t.id)}">
    <div class="field"><label>Name</label><input id="templateName" value="${esc(t.name)}"></div>
    <div class="field"><label>Channel</label><select id="templateChannel">${["Text","Email"].map(x=>`<option ${t.channel===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Category</label><select id="templateCategory">${["Seller","Buyer","Relationship","Partner","Transaction","General"].map(x=>`<option ${t.category===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Email subject</label><input id="templateSubject" value="${esc(t.subject)}"></div>
    <div class="field full"><label>Message</label><textarea id="templateBody" rows="8">${esc(t.body)}</textarea><small class="field-help">Fields: {{first_name}}, {{last_name}}, {{full_name}}, {{property}}, {{agent_name}}, {{agent_phone}}, {{agent_email}}</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>${t.id?`<button class="danger-btn" data-action="delete-template" data-id="${t.id}">Delete</button>`:""}<button class="primary-btn" data-action="save-template">Save template</button>`)
}
function saveTemplate(){
  const id=document.getElementById("templateId").value||uid(),name=document.getElementById("templateName").value.trim(),body=document.getElementById("templateBody").value.trim();
  if(!name||!body)return alert("Add a template name and message.");
  const template={id,name,channel:document.getElementById("templateChannel").value,category:document.getElementById("templateCategory").value,subject:document.getElementById("templateSubject").value.trim(),body};
  const index=db.templates.findIndex(x=>x.id===id);if(index>=0)db.templates[index]=template;else db.templates.push(template);
  save();closeModal();renderSettings();toast("Template saved",name)
}
function deleteTemplate(id){
  if(!confirm("Delete this message template?"))return;
  db.templates=db.templates.filter(x=>x.id!==id);save();closeModal();renderSettings()
}
function applyStageWorkflow(c,oldStage,newStage){
  if(oldStage===newStage)return;
  const addTask=(title,type,due=TODAY(),priority="Normal")=>{
    if(!db.tasks.some(t=>t.contactId===c.id&&t.status!=="Done"&&t.title===title))db.tasks.unshift({id:uid(),contactId:c.id,title,type,due,status:"Open",priority,planRunId:"",createdAt:TODAY()})
  };
  if(newStage==="Valuation Requested"){
    addTask("Research property and prepare valuation","Task",TODAY(),"High");
    addTask("Deliver valuation and explain the range","Call",addDays(TODAY(),1),"High")
  }
  if(newStage==="Valuation Delivered")addTask("Follow up on valuation and motivation","Call",addDays(TODAY(),2),"High");
  if(newStage==="Listing Appointment"){
    addTask("Confirm appointment and all decision makers","Appointment",TODAY(),"High");
    addTask("Prepare CMA and pricing range","Task",TODAY(),"High");
    addTask("Prepare seller net sheet and marketing plan","Task",TODAY(),"High")
  }
  if(newStage==="Listing Agreement Signed"){
    addTask("Complete signed-listing launch checklist","Task",TODAY(),"High");
    addTask("Schedule photography and media","Task",addDays(TODAY(),1),"High")
  }
  if(newStage==="Coming Soon")addTask("Verify coming-soon launch and seller communication","Task",TODAY(),"High");
  if(newStage==="Active Listing"){
    addTask("Send first active-listing seller update","Call",addDays(TODAY(),2),"High");
    addTask("Review pricing, competition, and feedback","Task",addDays(TODAY(),7),"High")
  }
  if(newStage==="Offer Received")addTask("Review offer and net proceeds with seller","Call",TODAY(),"High");
  if(newStage==="Under Contract"){
    const tx=ensureTransactionForContact(c);
    if(tx&&!transactionSetupComplete(tx))setTimeout(()=>toast("Transaction setup needed",`${fullName(c)} needs the signed contract dates and property details entered in Transaction Center.`),30)
  }
  if(newStage==="Closed"){
    transactionsForContact(c.id).filter(tx=>!["Closed","Terminated"].includes(tx.status)).forEach(tx=>{tx.status="Closed";tx.closedAt=NOW();tx.updatedAt=NOW()})
  }
  if(newStage==="Lost"){
    transactionsForContact(c.id).filter(tx=>!["Closed","Terminated"].includes(tx.status)).forEach(tx=>{tx.status="Terminated";tx.updatedAt=NOW()})
  }
}


let scriptDraftSaveTimer=null;
function recommendedScriptCategory(c){
  if(!c)return "General";
  if(["Realtor","Lender"].includes(c.type))return "Partner";
  if(c.type==="Past Client")return "Past Client";
  if(c.type==="Buyer")return "Buyer";
  if(c.type!=="Seller")return "General";
  if(c.stage==="Listing Appointment")return "Listing Appointment";
  if(["Active Listing","Coming Soon","Offer Received"].includes(c.stage))return "Active Listing";
  if(["Valuation Requested","Valuation Delivered"].includes(c.stage))return "Valuation";
  if(["Nurture","Follow-Up"].includes(c.stage))return "Future Seller";
  return "New Seller"
}
function scriptForContact(c,scriptId=""){
  const draft=db.scriptDrafts?.[c?.id]||{};
  const exact=db.callScripts.find(s=>s.id===(scriptId||draft.scriptId));
  if(exact)return exact;
  const category=recommendedScriptCategory(c);
  return db.callScripts.find(s=>s.category===category)||db.callScripts.find(s=>s.category==="General")||db.callScripts[0]
}
function scriptVariables(c,extra={}){
  const p=primaryProperty(c);
  return {
    first_name:c?.firstName||"there",last_name:c?.lastName||"",full_name:c?fullName(c):"",
    property:propertyAddress(p)||c?.property||"the property",contact_address:contactAddressDisplay(c)||"the contact address",
    agent_name:db.settings.agentName||"Jacob",agent_phone:db.settings.agentPhone||"your number",
    agent_email:db.settings.agentEmail||"",appointment_day:extra.appointment_day||"a time that works for you",
    follow_up_day:extra.follow_up_day||"the date we agree on",next_step:extra.next_step||"the next step",
    recommended_action:extra.recommended_action||"the next strategy",market_signal:extra.market_signal||"the current response"
  }
}
function fillScriptText(text,c,extra={}){
  const vars=scriptVariables(c,extra);
  return String(text||"").replace(/\{\{(\w+)\}\}/g,(_,key)=>vars[key]??`{{${key}}}`)
}
function reasonToCall(c){
  const unread=db.communications.filter(m=>m.contactId===c.id&&m.unread).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  if(unread)return `Unread ${unread.channel.toLowerCase()} waiting since ${dateTimeLabel(unread.date)}`;
  const callTask=db.tasks.filter(t=>t.contactId===c.id&&t.status!=="Done"&&t.type==="Call").sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];
  if(callTask)return `${callTask.title} • ${callTask.due<TODAY()?"overdue":"due"} ${dateLabel(callTask.due)}`;
  if(c.followUp)return `${c.followUp<TODAY()?"Follow-up overdue":"Next follow-up"} • ${dateLabel(c.followUp)}`;
  if(c.type==="Seller"&&c.stage==="Active Listing")return `${daysSince(c.lastCommunication)} days since the last seller update`;
  return `${c.type} • ${c.stage} • ${c.heat}`
}
function lastConversationPreview(c){
  const last=db.communications.filter(m=>m.contactId===c.id).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  if(!last)return "No prior communication is logged.";
  return `${last.channel}${last.outcome?` • ${last.outcome}`:""} • ${dateTimeLabel(last.date)}${last.body?` — ${last.body.slice(0,170)}`:""}`
}
function scriptPrepFacts(c){
  const p=primaryProperty(c),facts=[];
  facts.push({label:"Reason now",value:reasonToCall(c)});
  facts.push({label:"Contact address",value:contactAddressDisplay(c)||"Not saved yet"});
  if(c.type==="Seller"){
    facts.push({label:"Property",value:propertyAddress(p)||c.property||"Address needed"});
    facts.push({label:"Motivation",value:p?.motivation||c.sellerDetails?.motivation||"Not learned yet"});
    facts.push({label:"Timing",value:c.timeframe||"Unknown"});
    facts.push({label:"Decision makers",value:c.sellerDetails?.decisionMakers||((c.household||[]).filter(x=>x.decisionMaker).map(householdName).join(", ")||"Not confirmed")});
  }else if(c.type==="Buyer"){
    facts.push({label:"Payment goal",value:c.buyerDetails?.desiredPayment?money(c.buyerDetails.desiredPayment):"Not learned yet"});
    facts.push({label:"Areas",value:c.buyerDetails?.areas||c.preferences?.areas||"Not learned yet"});
    facts.push({label:"Financing",value:c.buyerDetails?.preapproval||"Unknown"});
    facts.push({label:"Timing",value:c.timeframe||"Unknown"});
  }else{
    facts.push({label:"Relationship",value:c.sphereDetails?.relationship||c.professionalDetails?.company||c.type});
    facts.push({label:"Last touch",value:c.lastCommunication?dateLabel(c.lastCommunication):"Never"});
  }
  return facts
}
function scriptDraft(c,script){
  const existing=db.scriptDrafts?.[c.id]||{};
  return {
    scriptId:existing.scriptId||script.id,notes:existing.notes||"",outcome:existing.outcome||"Connected",
    followUp:existing.followUp||c.followUp||addDays(TODAY(),2),appointmentDate:existing.appointmentDate||"",
    updatedAt:existing.updatedAt||""
  }
}
function scriptOptions(selected){
  const groups=[...new Set(db.callScripts.map(s=>s.category))];
  return groups.map(category=>`<optgroup label="${esc(category)}">${db.callScripts.filter(s=>s.category===category).map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${esc(s.name)}</option>`).join("")}</optgroup>`).join("")
}
function openConversationMode(contactId,context="profile",taskId="",workItemId="",scriptId=""){
  const c=contact(contactId);if(!c)return;
  const script=scriptForContact(c,scriptId),draft=scriptDraft(c,script),facts=scriptPrepFacts(c);
  const p=primaryProperty(c),phone=c.phone||"No phone number";
  modal(`Conversation Mode — ${fullName(c)}`,`<div class="conversation-mode">
    <input type="hidden" id="scriptContactId" value="${c.id}">
    <input type="hidden" id="scriptContext" value="${esc(context)}">
    <input type="hidden" id="scriptTaskId" value="${esc(taskId||"")}">
    <input type="hidden" id="scriptWorkItemId" value="${esc(workItemId||"")}">
    <header class="conversation-prep">
      <div class="conversation-person">${avatar(c)}<div><span>${esc(c.type)} • ${esc(c.stage)} • ${esc(c.heat)}</span><h2>${esc(fullName(c))}</h2><p>${esc(phone)}${contactAddressDisplay(c)?` • ${esc(contactAddressDisplay(c))}`:" • Address missing"}</p></div></div>
      <div class="conversation-top-actions">
        <button class="ghost-btn compact" data-action="copy-phone" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>Copy number</button>
        <button class="primary-btn compact" data-action="script-call" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>☎ Call now</button>
      </div>
    </header>
    <div class="conversation-facts">${facts.map(f=>`<div><label>${esc(f.label)}</label><strong>${esc(String(f.value||"—"))}</strong></div>`).join("")}</div>
    <div class="conversation-layout">
      <main class="script-main">
        <div class="script-selector"><div><span>RECOMMENDED SCRIPT</span><strong>${esc(script.name)}</strong></div><select id="scriptSelect">${scriptOptions(script.id)}</select></div>
        <section class="script-block opener-block"><div class="script-block-head"><div><span>OPEN NATURALLY</span><h3>Opening</h3></div><button class="copy-script-btn" data-action="copy-script-section" data-section="opener">Copy</button></div><p id="scriptOpenerText">${esc(fillScriptText(script.opener,c))}</p></section>
        <section class="script-block"><div class="script-block-head"><div><span>LISTEN MORE THAN YOU TALK</span><h3>Questions to uncover the real situation</h3></div></div>
          <div class="discovery-list">${script.questions.map((q,i)=>`<button class="discovery-question" data-action="toggle-script-question"><span>${i+1}</span>${esc(fillScriptText(q,c))}<b>✓</b></button>`).join("")}</div>
        </section>
        <section class="script-block"><div class="script-block-head"><div><span>ASK FOR THE NEXT STEP</span><h3>Close</h3></div><button class="copy-script-btn" data-action="copy-script-section" data-section="close">Copy</button></div><p id="scriptCloseText">${esc(fillScriptText(script.close,c))}</p></section>
        <section class="script-block voicemail-block"><div class="script-block-head"><div><span>WHEN THEY DO NOT ANSWER</span><h3>Voicemail</h3></div><button class="copy-script-btn" data-action="copy-script-section" data-section="voicemail">Copy</button></div><p id="scriptVoicemailText">${esc(fillScriptText(script.voicemail,c))}</p>
          <div class="script-inline-actions"><button class="ghost-btn compact" data-action="script-voicemail-text" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>Send follow-up text</button><button class="ghost-btn compact" data-action="set-script-outcome" data-outcome="Left Voicemail">Mark voicemail</button></div>
        </section>
      </main>
      <aside class="conversation-side">
        <section class="call-goal"><span>CALL GOAL</span><strong>${esc(fillScriptText(script.goal,c))}</strong></section>
        <section class="last-conversation"><span>LAST CONVERSATION</span><p>${esc(lastConversationPreview(c))}</p></section>
        <section class="objection-coach"><div><span>OBJECTION COACH</span><h3>Tap what they say</h3></div>
          <div class="objection-buttons">${script.objections.map((o,i)=>`<button data-action="show-script-objection" data-index="${i}">${esc(o.label)}</button>`).join("")}</div>
          <div class="objection-response" id="objectionResponse"><span>Response appears here</span><p>Stay curious, acknowledge the concern, and ask one useful follow-up question.</p></div>
        </section>
        <section class="live-call-notes">
          <div><span>LIVE NOTES</span><small>Draft syncs across devices</small></div>
          <textarea id="scriptNotes" placeholder="Motivation, decision makers, objections, timing, next step...">${esc(draft.notes)}</textarea>
        </section>
        <section class="script-outcome">
          <div class="field"><label>Outcome</label><select id="scriptOutcome">${["Connected","Left Voicemail","No Answer","Appointment Set","Follow-Up Needed","Not Interested"].map(x=>`<option ${draft.outcome===x?"selected":""}>${x}</option>`).join("")}</select></div>
          <div class="field"><label>Next follow-up</label><input id="scriptFollowUp" type="date" value="${esc(draft.followUp)}"></div>
          <div class="field appointment-field ${draft.outcome==="Appointment Set"?"show":""}" id="scriptAppointmentField"><label>Appointment date</label><input id="scriptAppointmentDate" type="date" value="${esc(draft.appointmentDate)}"></div>
        </section>
      </aside>
    </div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Keep draft & close</button>${context==="call-queue"?`<button class="ghost-btn" data-action="script-skip-next">Skip to next</button>`:""}<button class="primary-btn" data-action="save-script-outcome">Save outcome${context==="call-queue"?" & next":""}</button>`);
  document.getElementById("modal").classList.add("script-modal");
  saveScriptDraftFromFields(false)
}
function copyTextValue(text,label="Copied"){
  const value=String(text||"");
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(value).then(()=>toast(label,value.slice(0,80))).catch(()=>fallbackCopy(value,label))
  }else fallbackCopy(value,label)
}
function fallbackCopy(value,label){
  const area=document.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();
  try{document.execCommand("copy");toast(label,value.slice(0,80))}finally{area.remove()}
}
function copyScriptSection(section){
  const ids={opener:"scriptOpenerText",close:"scriptCloseText",voicemail:"scriptVoicemailText"};
  copyTextValue(document.getElementById(ids[section])?.textContent||"","Script copied")
}
function showScriptObjection(index){
  const c=contact(document.getElementById("scriptContactId")?.value),script=db.callScripts.find(s=>s.id===document.getElementById("scriptSelect")?.value);
  const objection=script?.objections?.[Number(index)];if(!objection||!c)return;
  document.querySelectorAll(".objection-buttons button").forEach((button,i)=>button.classList.toggle("active",i===Number(index)));
  const box=document.getElementById("objectionResponse");
  if(box)box.innerHTML=`<span>${esc(objection.label)}</span><p>${esc(fillScriptText(objection.response,c))}</p><button class="copy-script-btn" data-action="copy-objection" data-index="${index}">Copy response</button>`
}
function saveScriptDraftFromFields(immediate=true){
  const contactId=document.getElementById("scriptContactId")?.value;if(!contactId)return;
  const draft={
    scriptId:document.getElementById("scriptSelect")?.value||"",
    notes:document.getElementById("scriptNotes")?.value||"",
    outcome:document.getElementById("scriptOutcome")?.value||"Connected",
    followUp:document.getElementById("scriptFollowUp")?.value||"",
    appointmentDate:document.getElementById("scriptAppointmentDate")?.value||"",
    updatedAt:NOW()
  };
  db.scriptDrafts[contactId]=draft;
  clearTimeout(scriptDraftSaveTimer);
  if(immediate)scriptDraftSaveTimer=setTimeout(()=>save(false),450)
}
function changeConversationScript(){
  const contactId=document.getElementById("scriptContactId")?.value,context=document.getElementById("scriptContext")?.value||"profile",
    taskId=document.getElementById("scriptTaskId")?.value||"",workItemId=document.getElementById("scriptWorkItemId")?.value||"",
    scriptId=document.getElementById("scriptSelect")?.value||"";
  saveScriptDraftFromFields(false);save(false);openConversationMode(contactId,context,taskId,workItemId,scriptId)
}
function launchScriptCall(id){
  const c=contact(id);if(!c||!hasPhone(c))return;
  saveScriptDraftFromFields(false);save(false);
  location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`
}
function launchVoicemailText(id){
  const c=contact(id),script=db.callScripts.find(s=>s.id===document.getElementById("scriptSelect")?.value);if(!c||!script||!hasPhone(c))return;
  const body=fillScriptText(script.afterVoicemailText,c);
  saveScriptDraftFromFields(false);save(false);
  location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(body)}`
}
function setScriptOutcome(outcome){
  const select=document.getElementById("scriptOutcome");if(select){select.value=outcome;select.dispatchEvent(new Event("change",{bubbles:true}))}
}
function saveConversationOutcome(){
  const contactId=document.getElementById("scriptContactId")?.value,c=contact(contactId);if(!c)return;
  const script=db.callScripts.find(s=>s.id===document.getElementById("scriptSelect")?.value),outcome=document.getElementById("scriptOutcome")?.value||"Connected",
    notes=document.getElementById("scriptNotes")?.value.trim()||"",followUp=document.getElementById("scriptFollowUp")?.value||"",
    appointmentDate=document.getElementById("scriptAppointmentDate")?.value||"",context=document.getElementById("scriptContext")?.value||"profile",
    taskId=document.getElementById("scriptTaskId")?.value||"",workItemId=document.getElementById("scriptWorkItemId")?.value||"";
  if(outcome==="Appointment Set"&&!appointmentDate)return alert("Choose the appointment date.");
  if(isOpen(c)&&!["Appointment Set","Not Interested"].includes(outcome)&&!followUp)return alert("Set the next follow-up date.");
  db.communications.unshift({
    id:uid(),contactId,channel:"Call",direction:"outbound",outcome,
    body:[script?`Script: ${script.name}`:"",notes].filter(Boolean).join("\n\n"),
    date:NOW(),unread:false,threadStatus:"open",scriptId:script?.id||"",createdAt:NOW()
  });
  c.lastCommunication=TODAY();c.updatedAt=TODAY();
  if(followUp)c.followUp=followUp;
  if(outcome==="Appointment Set"){
    const oldStage=c.stage;c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";applyStageWorkflow(c,oldStage,c.stage);
    const title=`${c.type==="Buyer"?"Buyer consultation":"Listing appointment"} — ${fullName(c)}`;
    if(!db.tasks.some(t=>t.contactId===c.id&&t.status!=="Done"&&t.type==="Appointment"&&t.due===appointmentDate)){
      db.tasks.unshift({id:uid(),contactId:c.id,title,type:"Appointment",due:appointmentDate,status:"Open",priority:"High",planRunId:"",createdAt:TODAY()})
    }
    const p=primaryProperty(c);if(p)p.appointmentDate=appointmentDate
  }
  if(["Left Voicemail","No Answer","Follow-Up Needed"].includes(outcome)&&followUp&&!db.tasks.some(t=>t.contactId===c.id&&t.status!=="Done"&&t.due===followUp&&t.type==="Call")){
    db.tasks.unshift({id:uid(),contactId:c.id,title:`Follow up with ${fullName(c)}`,type:"Call",due:followUp,status:"Open",priority:c.heat==="Hot"?"High":"Normal",planRunId:"",createdAt:TODAY()})
  }
  if(outcome==="Not Interested"){
    c.stage="Lost";c.followUp="";
  }
  if(taskId){const t=task(taskId);if(t){t.status="Done";t.completedAt=TODAY()}}
  if(workItemId){delete db.workSnoozes[workItemId];db.workHistory.unshift({id:uid(),itemId:workItemId,contactId,action:"Conversation Mode completed",date:NOW()})}
  delete db.scriptDrafts[contactId];
  save();closeModal();toast("Conversation logged",`${outcome} • ${fullName(c)}`);
  if(context==="call-queue"){
    const remaining=callQueue();db.settings.callQueueResumeContactId=remaining[0]?.c.id||"";save(false);location.hash="#/call-queue";setTimeout(renderCallQueue,0)
  }else route()
}
function skipConversationToNext(){
  saveScriptDraftFromFields(false);save(false);closeModal();moveCallQueue(1);
  const q=callQueue(),active=q[activeCallQueueIndex(q)];if(active)setTimeout(()=>openConversationMode(active.c.id,"call-queue",active.task?.id||""),30)
}
function callScriptsSettingsHtml(){
  return `<section class="setting-card call-script-settings"><div class="setting-card-head"><div><h3>Conversation scripts</h3><p>One editable script library on desktop, iPad, and phone.</p></div><button class="primary-btn compact" data-action="open-call-script">＋ Add</button></div>
    <div class="script-settings-list">${db.callScripts.map(s=>`<div class="template-row"><div><strong>${esc(s.name)}</strong><span>${esc(s.category)} • ${s.questions.length} questions • ${s.objections.length} objections</span></div><button class="quick" data-action="open-call-script" data-id="${s.id}">Edit</button></div>`).join("")}</div>
    <button class="ghost-btn compact reset-scripts" data-action="reset-call-scripts">Restore starter scripts</button>
  </section>`
}
function callScriptEditorModal(id=""){
  const s=db.callScripts.find(x=>x.id===id)||{id:"",name:"",category:"General",goal:"",opener:"",questions:[],close:"",voicemail:"",afterVoicemailText:"",objections:[]};
  const objections=(s.objections||[]).map(o=>`${o.label} | ${o.response}`).join("\n");
  modal(s.id?"Edit conversation script":"New conversation script",`<div class="form-grid">
    <input id="callScriptId" type="hidden" value="${esc(s.id)}">
    <div class="field"><label>Name</label><input id="callScriptName" value="${esc(s.name)}"></div>
    <div class="field"><label>Use for</label><select id="callScriptCategory">${["New Seller","Valuation","Future Seller","Listing Appointment","Active Listing","Buyer","Past Client","Partner","General"].map(x=>`<option ${s.category===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Call goal</label><textarea id="callScriptGoal">${esc(s.goal)}</textarea></div>
    <div class="field full"><label>Opening</label><textarea id="callScriptOpener">${esc(s.opener)}</textarea></div>
    <div class="field full"><label>Discovery questions — one per line</label><textarea id="callScriptQuestions" rows="7">${esc((s.questions||[]).join("\n"))}</textarea></div>
    <div class="field full"><label>Close / next-step ask</label><textarea id="callScriptClose">${esc(s.close)}</textarea></div>
    <div class="field full"><label>Voicemail</label><textarea id="callScriptVoicemail">${esc(s.voicemail)}</textarea></div>
    <div class="field full"><label>Text after voicemail</label><textarea id="callScriptVoicemailText">${esc(s.afterVoicemailText)}</textarea></div>
    <div class="field full"><label>Objections — one per line: label | response</label><textarea id="callScriptObjections" rows="8">${esc(objections)}</textarea><small class="field-help">Variables: {{first_name}}, {{property}}, {{contact_address}}, {{agent_name}}, {{agent_phone}}</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>${s.id?`<button class="danger-btn" data-action="delete-call-script" data-id="${s.id}">Delete</button>`:""}<button class="primary-btn" data-action="save-call-script">Save script</button>`)
}
function saveCallScript(){
  const id=document.getElementById("callScriptId")?.value||uid(),name=document.getElementById("callScriptName")?.value.trim(),
    opener=document.getElementById("callScriptOpener")?.value.trim();
  if(!name||!opener)return alert("Add a script name and opening.");
  const questions=(document.getElementById("callScriptQuestions")?.value||"").split("\n").map(x=>x.trim()).filter(Boolean);
  const objections=(document.getElementById("callScriptObjections")?.value||"").split("\n").map(line=>{
    const [label,...rest]=line.split("|");return {label:(label||"").trim(),response:rest.join("|").trim()}
  }).filter(o=>o.label&&o.response);
  const script={id,name,category:document.getElementById("callScriptCategory")?.value||"General",
    goal:document.getElementById("callScriptGoal")?.value.trim()||"",opener,questions,
    close:document.getElementById("callScriptClose")?.value.trim()||"",voicemail:document.getElementById("callScriptVoicemail")?.value.trim()||"",
    afterVoicemailText:document.getElementById("callScriptVoicemailText")?.value.trim()||"",objections};
  const index=db.callScripts.findIndex(x=>x.id===id);if(index>=0)db.callScripts[index]=script;else db.callScripts.push(script);
  save();closeModal();renderSettings();toast("Conversation script saved",name)
}
function deleteCallScript(id){
  if(db.callScripts.length<=1)return alert("Keep at least one script.");
  if(!confirm("Delete this conversation script?"))return;
  db.callScripts=db.callScripts.filter(x=>x.id!==id);
  Object.values(db.scriptDrafts||{}).forEach(d=>{if(d.scriptId===id)d.scriptId=""});
  save();closeModal();renderSettings()
}
function resetCallScripts(){
  if(!confirm("Restore all starter scripts? Your custom script edits will be replaced."))return;
  db.callScripts=JSON.parse(JSON.stringify(defaultCallScripts));save();renderSettings();toast("Starter scripts restored","Conversation Mode is back to the Holton Homes defaults.")
}

function threads(){
  const map=new Map();
  db.communications.forEach(m=>{
    if(!map.has(m.contactId))map.set(m.contactId,[]);
    map.get(m.contactId).push(m)
  });
  return [...map.entries()].map(([contactId,messages])=>{
    messages.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const last=messages.at(-1),c=contact(contactId);
    return {contact:c,messages,last,unread:messages.some(x=>x.unread),status:last?.threadStatus||"open"}
  }).filter(x=>x.contact).sort((a,b)=>String(b.last.date).localeCompare(String(a.last.date)))
}
function renderInbox(){
  let list=threads();
  if(state.inboxFolder==="unread")list=list.filter(t=>t.unread);
  if(state.inboxFolder==="open")list=list.filter(t=>t.status!=="closed");
  if(state.inboxFolder==="closed")list=list.filter(t=>t.status==="closed");
  if(!state.activeThread||!list.some(x=>x.contact.id===state.activeThread))state.activeThread=list[0]?.contact.id||null;
  const active=list.find(x=>x.contact.id===state.activeThread);
  document.getElementById("view").innerHTML=
    pageHead("Conversation command center","Inbox","Calls, texts, emails, and notes in one relationship-focused workflow.",`<button class="ghost-btn" data-action="inbox-zero">Mark all read</button>`) +
    `<div class="inbox-layout">
      <aside class="inbox-folders">${[["open","Open",threads().filter(t=>t.status!=="closed").length],["unread","Unread",threads().filter(t=>t.unread).length],["all","All",threads().length],["closed","Closed",threads().filter(t=>t.status==="closed").length]].map(([id,label,count])=>`<button class="folder-btn ${state.inboxFolder===id?"active":""}" data-action="inbox-folder" data-id="${id}"><span>${label}</span><b>${count}</b></button>`).join("")}</aside>
      <section class="thread-list">${list.length?list.map(t=>`<article class="thread ${t.unread?"unread":""} ${active?.contact.id===t.contact.id?"active":""}" data-action="open-thread" data-id="${t.contact.id}"><div class="thread-top"><strong><a class="person-name-link" href="#/contact/${t.contact.id}" data-action="name-link">${esc(fullName(t.contact))}</a></strong><time>${dateTimeLabel(t.last.date)}</time></div><p>${esc(t.last.body||`${t.last.channel} • ${t.last.outcome}`)}</p></article>`).join(""):`<div class="empty">Inbox zero. No conversations here.</div>`}</section>
      ${active?conversationHtml(active):`<section class="conversation"><div class="empty">Select a conversation.</div></section>`}
    </div>`;
}
function conversationHtml(thread){
  thread.messages.forEach(m=>m.unread=false);save();
  return `<section class="conversation"><div class="conversation-head"><div><strong><a class="person-name-link" href="#/contact/${thread.contact.id}">${esc(fullName(thread.contact))}</a></strong><small style="display:block;color:var(--muted);font-size:8px">${esc(thread.contact.stage)} • ${esc(thread.contact.phone||thread.contact.email)}</small></div><div class="row-actions">${contactQuickActions(thread.contact)}<button class="quick" data-action="toggle-thread" data-id="${thread.contact.id}">${thread.status==="closed"?"Reopen":"Close"}</button></div></div>
  <div class="messages">${thread.messages.map(m=>`<div class="message ${m.direction==="outbound"?"outbound":""}"><b>${esc(m.channel)}${m.outcome?` • ${esc(m.outcome)}`:""}</b><div>${esc(m.body||"No details")}</div><small>${dateTimeLabel(m.date)}</small></div>`).join("")}</div>
  <div class="composer"><textarea id="inboxReply" placeholder="Write a text reply or relationship note..."></textarea><div class="composer-row"><select id="inboxChannel"><option>Text</option><option>Email</option><option>Note</option></select><button class="primary-btn compact" data-action="send-inbox-reply" data-id="${thread.contact.id}">Launch & log</button></div></div></section>`
}


function scoreLabel(score){return score>=70?"High":score>=40?"Medium":"Low"}
function scoreImprovement(c){
  const ideas=[];
  if(!c.lastCommunication)ideas.push("Log the first real conversation");
  else if(daysSince(c.lastCommunication)>=7)ideas.push("Reconnect after a week of silence");
  if(c.timeframe==="Unknown")ideas.push("Confirm timing");
  if(!c.followUp)ideas.push("Schedule the next follow-up");
  if(!c.property)ideas.push(c.type==="Buyer"?"Confirm target area and payment":"Confirm property or neighborhood");
  if((c.behaviors||[]).length===0&&["Buyer","Seller"].includes(c.type))ideas.push("Add property or market activity");
  return ideas.slice(0,3);
}
function nextActionFor(c,tasks){
  const nextTask=tasks.find(t=>t.status!=="Done");
  if(nextTask)return {title:nextTask.title,due:nextTask.due,channel:nextTask.type==="Follow Up"?(hasPhone(c)?"Call":"Email"):nextTask.type,taskId:nextTask.id};
  if(!c.lastCommunication){
    if(c.type==="Realtor")return {title:"Introduce Holton Homes and discuss referral opportunities",due:c.followUp||TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
    if(c.type==="Lender")return {title:"Discuss loan programs, response times, and referral fit",due:c.followUp||TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
    if(c.type==="Sphere"||c.type==="Past Client")return {title:"Send a personal introduction and ask about their real estate plans",due:c.followUp||TODAY(),channel:hasPhone(c)?"Text":"Email",taskId:""};
    if(c.type==="Seller")return {title:"Call to confirm motivation, property, and selling timeline",due:c.followUp||TODAY(),channel:"Call",taskId:""};
    if(c.type==="Buyer")return {title:"Call to confirm financing, payment goal, and target area",due:c.followUp||TODAY(),channel:"Call",taskId:""};
  }
  if(c.followUp)return {title:`Complete scheduled follow-up with ${fullName(c)}`,due:c.followUp,channel:hasPhone(c)?"Call":"Email",taskId:""};
  return {title:"Create the next meaningful touch",due:TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
}

function householdName(member){
  return [member.firstName,member.lastName].filter(Boolean).join(" ").trim()||"Unnamed household member"
}
function spouseMember(c){
  return (c.household||[]).find(member=>["Spouse","Partner","Spouse / Partner"].includes(member.relationship))
}
function householdHtml(c){
  const members=c.household||[];
  if(!members.length){
    return `<div class="compact-empty household-empty"><div><strong>No spouse or household members added.</strong><span>Add the people who share decisions, finances, or the property.</span></div><button class="ghost-btn compact" data-action="open-household" data-id="${c.id}">＋ Add spouse</button></div>`;
  }
  return `<div class="household-list">${members.map(member=>{
    const linked=member.linkedContactId?contact(member.linkedContactId):null;
    return `<article class="household-member">
      <div class="household-avatar" aria-hidden="true">${esc((member.firstName?.[0]||"?")+(member.lastName?.[0]||""))}</div>
      <div class="household-copy">
        <div class="household-name-row">
          <strong>${linked?`<a class="person-name-link" href="#/contact/${linked.id}">${esc(householdName(member))}</a>`:esc(householdName(member))}</strong>
          <span class="badge">${esc(member.relationship||"Household")}</span>
          ${member.decisionMaker?`<span class="badge good">Decision maker</span>`:""}
        </div>
        <small>${esc(member.phone||"No phone")}${member.email?` • ${esc(member.email)}`:" • No email"}</small>
        ${member.notes?`<p>${esc(member.notes)}</p>`:""}
      </div>
      <div class="household-actions">
        ${member.phone?`<button class="quick call" data-action="household-communicate" data-channel="Call" data-contact="${c.id}" data-member="${member.id}">☎</button><button class="quick text" data-action="household-communicate" data-channel="Text" data-contact="${c.id}" data-member="${member.id}">✉</button>`:""}
        ${member.email?`<button class="quick email" data-action="household-communicate" data-channel="Email" data-contact="${c.id}" data-member="${member.id}">@</button>`:""}
        <button class="quick" data-action="open-household" data-id="${c.id}" data-member="${member.id}">Edit</button>
        ${linked?`<a class="quick" href="#/contact/${linked.id}">Open</a>`:`<button class="quick" data-action="promote-household" data-id="${c.id}" data-member="${member.id}">Make contact</button>`}
      </div>
    </article>`
  }).join("")}<button class="ghost-btn compact full-width" data-action="open-household" data-id="${c.id}">＋ Add household member</button></div>`
}
function householdModal(contactId,memberId=""){
  const c=contact(contactId);
  if(!c)return;
  const member=(c.household||[]).find(m=>m.id===memberId)||{
    id:"",relationship:"Spouse / Partner",firstName:"",lastName:"",phone:"",email:"",
    decisionMaker:true,anniversary:"",birthday:"",notes:"",linkedContactId:""
  };
  modal(member.id?`Edit ${householdName(member)}`:`Add spouse or household member`,`<div class="form-grid">
    <input type="hidden" id="householdContactId" value="${esc(c.id)}">
    <input type="hidden" id="householdMemberId" value="${esc(member.id||"")}">
    <div class="field"><label>Relationship</label><select id="householdRelationship">${["Spouse / Partner","Spouse","Partner","Parent","Adult Child","Child","Sibling","Co-owner","Other"].map(x=>`<option ${member.relationship===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Decision maker</label><select id="householdDecisionMaker"><option value="true" ${member.decisionMaker?"selected":""}>Yes</option><option value="false" ${!member.decisionMaker?"selected":""}>No</option></select></div>
    <div class="field"><label>First name</label><input id="householdFirstName" value="${esc(member.firstName||"")}"></div>
    <div class="field"><label>Last name</label><input id="householdLastName" value="${esc(member.lastName||"")}"></div>
    <div class="field"><label>Phone</label><input id="householdPhone" type="tel" value="${esc(member.phone||"")}"></div>
    <div class="field"><label>Email</label><input id="householdEmail" type="email" value="${esc(member.email||"")}"></div>
    <div class="field"><label>Anniversary</label><input id="householdAnniversary" type="date" value="${esc(member.anniversary||"")}"></div>
    <div class="field"><label>Birthday</label><input id="householdBirthday" type="date" value="${esc(member.birthday||"")}"></div>
    <div class="field full"><label>Notes</label><textarea id="householdNotes" placeholder="Role in the decision, communication preferences, ownership details...">${esc(member.notes||"")}</textarea></div>
    <div class="field full"><div class="warning">Adding a spouse here keeps the household together. Use “Make contact” later when they need their own timeline, tasks, automations, or lead status.</div></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button>${member.id?`<button class="danger-btn" data-action="delete-household" data-id="${c.id}" data-member="${member.id}">Remove</button>`:""}<button class="primary-btn" data-action="save-household">Save household member</button>`)
}
function saveHousehold(){
  const contactId=document.getElementById("householdContactId").value,c=contact(contactId);
  if(!c)return;
  const memberId=document.getElementById("householdMemberId").value||uid(),
    firstName=document.getElementById("householdFirstName").value.trim(),
    lastName=document.getElementById("householdLastName").value.trim();
  if(!firstName){alert("Add at least a first name.");return}
  const old=(c.household||[]).find(m=>m.id===memberId);
  const member={
    id:memberId,
    relationship:document.getElementById("householdRelationship").value,
    firstName,lastName,
    phone:document.getElementById("householdPhone").value.trim(),
    email:document.getElementById("householdEmail").value.trim(),
    decisionMaker:document.getElementById("householdDecisionMaker").value==="true",
    anniversary:document.getElementById("householdAnniversary").value,
    birthday:document.getElementById("householdBirthday").value,
    notes:document.getElementById("householdNotes").value.trim(),
    linkedContactId:old?.linkedContactId||""
  };
  const i=(c.household||[]).findIndex(m=>m.id===memberId);
  if(i>=0)c.household[i]=member;else c.household.push(member);
  c.updatedAt=TODAY();
  save();closeModal();toast("Household updated",`${householdName(member)} added to ${fullName(c)}`);renderContact(c.id)
}
function deleteHousehold(contactId,memberId){
  const c=contact(contactId),member=(c?.household||[]).find(m=>m.id===memberId);
  if(!c||!member)return;
  if(!confirm(`Remove ${householdName(member)} from this household?`))return;
  c.household=c.household.filter(m=>m.id!==memberId);
  c.updatedAt=TODAY();save();closeModal();toast("Household member removed",householdName(member));renderContact(c.id)
}
function promoteHouseholdToContact(contactId,memberId){
  const c=contact(contactId),member=(c?.household||[]).find(m=>m.id===memberId);
  if(!c||!member)return;
  if(member.linkedContactId&&contact(member.linkedContactId)){location.hash=`#/contact/${member.linkedContactId}`;return}
  const newContact={
    id:uid(),firstName:member.firstName,lastName:member.lastName,name:householdName(member),
    phone:member.phone,email:member.email,type:c.type,stage:c.stage,heat:c.heat,timeframe:c.timeframe,
    followUp:c.followUp,lastCommunication:"",source:c.source,gci:0,property:c.property,
    tags:[...new Set([...(c.tags||[]),"Household"])],notes:`Household member of ${fullName(c)}.${member.notes?` ${member.notes}`:""}`,
    createdAt:TODAY(),updatedAt:TODAY(),household:[],preferences:{areas:"",minPrice:"",maxPrice:"",beds:"",baths:""},
    sellerDetails:{motivation:"",estimatedValue:"",mortgageBalance:"",condition:"",decisionMakers:""},
    buyerDetails:{preapproval:"Unknown",lender:"",budget:"",desiredPayment:"",areas:"",beds:"",baths:"",leaseExpiration:""},
    sphereDetails:{relationship:"",birthday:member.birthday||"",neighborhood:"",homeowner:"Unknown",likelyOpportunity:""},
    professionalDetails:{company:"",role:"",licenseNumber:"",serviceArea:"",specialties:"",referralNotes:""},
    alertSettings:{propertyAlert:false,marketSnapshot:false,criteria:"",frequency:"Weekly",lastSent:""},
    behaviors:[]
  };
  db.contacts.unshift(newContact);
  member.linkedContactId=newContact.id;
  c.updatedAt=TODAY();
  db.communications.unshift({id:uid(),contactId:c.id,channel:"Note",direction:"outbound",outcome:"Household linked",body:`${householdName(member)} was promoted to their own CRM contact.`,date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});
  save();toast("Contact created",householdName(member));location.hash=`#/contact/${newContact.id}`
}
function householdCommunicate(contactId,memberId,channel){
  const c=contact(contactId),member=(c?.household||[]).find(m=>m.id===memberId);
  if(!c||!member)return;
  const subject=`Holton Homes follow-up`;
  if(channel==="Call"&&member.phone)location.href=`tel:${member.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Text"&&member.phone)location.href=`sms:${member.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Email"&&member.email)location.href=`mailto:${member.email}?subject=${encodeURIComponent(subject)}`;
  db.communications.unshift({id:uid(),contactId:c.id,channel,direction:"outbound",outcome:`Household: ${householdName(member)}`,body:`Launched ${channel.toLowerCase()} to ${householdName(member)}.`,date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();c.updatedAt=TODAY();save();toast(`${channel} launched`,householdName(member));renderContact(c.id)
}

function typeSpecificHtml(c){
  if(c.type==="Seller"){
    const d=c.sellerDetails||{};
    const p=primaryProperty(c);
    return `${detail("Primary property",propertyDisplay(c)||"Not set")}${detail("Estimated value",p?.estimatedValue?money(p.estimatedValue):d.estimatedValue?money(d.estimatedValue):"Unknown")}${detail("Estimated equity",p?.estimatedValue?money(propertyEquity(p)):"Unknown")}${detail("Motivation",p?.motivation||d.motivation||"Unknown")}${detail("Mortgage balance",p?.mortgageBalance?money(p.mortgageBalance):d.mortgageBalance?money(d.mortgageBalance):"Unknown")}${detail("Condition",p?.condition||d.condition||"Unknown")}${detail("Decision makers",d.decisionMakers||"Unknown")}`;
  }
  if(c.type==="Buyer"){
    const d=c.buyerDetails||{};
    return `${detail("Preapproval",d.preapproval||"Unknown")}${detail("Lender",d.lender||"Not set")}${detail("Budget",d.budget?money(d.budget):"Unknown")}${detail("Desired payment",d.desiredPayment?money(d.desiredPayment):"Unknown")}${detail("Areas",d.areas||c.property||"Not set")}${detail("Beds / baths",[d.beds,d.baths].filter(Boolean).join(" / ")||"Unknown")}${detail("Lease expiration",d.leaseExpiration?dateLabel(d.leaseExpiration):"Not set")}`;
  }
  if(["Realtor","Lender"].includes(c.type)){
    const d=c.professionalDetails||{};
    return `${detail("Company",d.company||"Not set")}${detail("Role",d.role||c.type)}${detail("License / NMLS",d.licenseNumber||"Not set")}${detail("Service area",d.serviceArea||c.property||"Not set")}${detail("Specialties",d.specialties||"Not set")}${detail("Referral notes",d.referralNotes||"Not set")}`;
  }
  const d=c.sphereDetails||{};
  return `${detail("Relationship",d.relationship||"Not set")}${detail("Homeowner",d.homeowner||"Unknown")}${detail("Neighborhood",d.neighborhood||c.property||"Not set")}${detail("Likely opportunity",d.likelyOpportunity||"Unknown")}${detail("Birthday",d.birthday?dateLabel(d.birthday):"Not set")}`;
}
function inlineSelect(field,value,options,id){
  return `<select class="inline-select" data-action="inline-contact-field" data-field="${field}" data-id="${id}">${options.map(x=>`<option ${x===value?"selected":""}>${esc(x)}</option>`).join("")}</select>`;
}
function activityComposer(c){
  return `<div class="activity-composer">
    <div class="composer-title"><div><strong>Log activity</strong><small>Record the touch and schedule the next step without leaving this page.</small></div></div>
    <div class="composer-tabs">${["Note","Call","Text","Email","Appointment"].map((x,i)=>`<button class="composer-tab ${i===0?"active":""}" data-action="composer-channel" data-id="${c.id}" data-channel="${x}">${x}</button>`).join("")}</div>
    <input type="hidden" id="profileComposerChannel" value="Note">
    <div class="composer-fields">
      <select id="profileComposerDirection"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select>
      <select id="profileComposerOutcome"><option>Connected</option><option>Replied</option><option>Left Voicemail</option><option>No Answer</option><option>Appointment Set</option><option>Follow-Up Needed</option><option>Completed</option></select>
      <input id="profileComposerFollowUp" type="date" value="${addDays(TODAY(),3)}" title="Next follow-up">
    </div>
    <textarea id="profileComposerBody" placeholder="Add context, what they said, motivation, objections, and the next step..."></textarea>
    <div class="composer-footer"><span>Next follow-up is required for open leads.</span><div><button class="ghost-btn compact" data-action="launch-inline-channel" data-id="${c.id}">Launch</button><button class="primary-btn compact" data-action="save-inline-activity" data-id="${c.id}">Save & log</button></div></div>
  </div>`;
}
function contactEmptyTimeline(c){
  const recommended=c.type==="Seller"?"Call to learn motivation and timeline":c.type==="Buyer"?"Call to learn financing and payment goal":"Send a personal introduction";
  return `<div class="actionable-empty"><strong>No communication logged yet.</strong><p>Start the relationship instead of leaving an empty timeline.</p><div class="row-actions">${contactQuickActions(c,true)}<button class="quick" data-action="open-note" data-id="${c.id}">＋ Note</button></div><small>Recommended: ${esc(recommended)}</small></div>`;
}

function renderContact(id){
  const c=contact(id);if(!c){location.hash="#/people";return}
  const s=scoreContact(c),
    comms=db.communications.filter(x=>x.contactId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date))),
    tasks=db.tasks.filter(x=>x.contactId===id&&x.status!=="Done").sort((a,b)=>a.due.localeCompare(b.due)),
    runs=db.planRuns.filter(x=>x.contactId===id),
    next=nextActionFor(c,tasks),
    improvements=scoreImprovement(c),
    summary=contactSummary(c,s);
  const stages=c.type==="Buyer"?buyerStages:sellerStages;
  document.getElementById("view").innerHTML=
    backupWarningHtml() +
    `<section class="contact-hero">
      <div class="contact-identity">${avatar(c)}<div>
        <div class="eyebrow">${["Realtor","Lender"].includes(c.type)?"REFERRAL PARTNER":`${esc(c.type)} CONTACT`}</div>
        <h1>${esc(fullName(c))}</h1>
        <div class="contact-lines">
          ${hasPhone(c)?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,""))}">${esc(c.phone)}</a>`:`<span class="missing">No phone</span>`}
          <span>•</span>
          ${hasEmail(c)?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:`<span class="missing">No email</span>`}
        </div>
        <div class="contact-hero-address">
          ${contactAddressDisplay(c)?`<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddressDisplay(c))}">⌖ ${esc(contactAddressDisplay(c))}</a><button data-action="copy-contact-address" data-id="${c.id}">Copy</button>`:`<button class="missing-address-hero" data-action="open-contact" data-id="${c.id}">＋ Add contact address</button>`}
        </div>
        <div class="inline-fields">
          <span class="field-label">Stage ${inlineSelect("stage",c.stage,stages,c.id)}</span>
          <span class="field-label">Heat ${inlineSelect("heat",c.heat,["Hot","Warm","Cold"],c.id)}</span>
          <span class="field-label">Source ${inlineSelect("source",c.source,sources,c.id)}</span>
          <span class="field-label">Timeframe ${inlineSelect("timeframe",c.timeframe,["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"],c.id)}</span>
        </div>
      </div></div>
      <div class="hero-actions">${contactQuickActions(c,true)}<button class="quick note-large" data-action="open-note" data-id="${c.id}">＋ Note</button><button class="ghost-btn compact" data-action="open-contact" data-id="${c.id}">Edit</button><button class="ghost-btn compact contact-trash" data-action="trash-contact" data-id="${c.id}">Trash</button></div>
    </section>

    <section class="next-action-strip">
      <div class="next-action-copy"><span>NEXT ACTION</span><strong>${esc(next.title)}</strong><small class="${next.due<TODAY()?"overdue":""}">${next.due===TODAY()?"Due today":`Due ${dateLabel(next.due)}`}</small></div>
      <div class="next-action-buttons">
        <button class="primary-btn" data-action="complete-next-action" data-id="${c.id}" data-channel="${esc(next.channel)}" data-task="${esc(next.taskId)}">Complete & log</button>
        <button class="ghost-btn" data-action="show-script" data-id="${c.id}" data-context="profile" data-task="${esc(next.taskId)}">▤ Show script</button>
        <button class="ghost-btn" data-action="reschedule-contact" data-id="${c.id}">Reschedule</button>
      </div>
    </section>

    <div class="contact-workspace">
      <main class="contact-main">
        <section class="what-matters">
          <div><div class="eyebrow">WHAT MATTERS</div><p>${esc(summary)}</p></div>
          ${(c.household||[]).length&&!c.household.some(member=>member.decisionMaker)?`<div class="decision-warning">Confirm who makes the final decision.</div>`:""}<div class="score-block"><span class="score ${scoreClass(s.score)}">${s.score}</span><div><strong>${scoreLabel(s.score)} score</strong><small>${improvements.length?`Improve it: ${esc(improvements.join(" • "))}`:"Strong relationship data and activity."}</small></div></div>
        </section>

        ${activityComposer(c)}

        <section class="timeline-card">
          <div class="section-head"><div><h2>Communication timeline</h2><p>Calls, texts, emails, notes, appointments, tasks, and property activity.</p></div><button class="ghost-btn compact" data-action="open-communication" data-id="${c.id}" data-channel="Note">Open full logger</button></div>
          <div class="timeline">${timelineHtml(c,comms,tasks)}</div>
        </section>
      </main>

      <aside class="contact-sidebar">
        <details class="compact-panel" open><summary>Contact & lead details <span>Edit inline above</span></summary><div class="compact-body detail-grid">
          ${detail("Phone",c.phone||"Missing")}${detail("Email",c.email||"Missing")}${detail("Next follow-up",dateLabel(c.followUp))}${detail("Last communication",c.lastCommunication?dateLabel(c.lastCommunication):"Never")}${detail("Estimated from open opportunities GCI",money(c.gci))}<div class="detail tag-detail"><label>Tags</label>${renderTagChips(c.tags,c.id)}<button class="add-tag-inline" data-action="open-tag" data-id="${c.id}">＋ Add tag</button></div>
        </div></details>

        <details class="compact-panel" open><summary>Contact / mailing address <span>${contactAddressComplete(c)?"Complete":"Missing"}</span></summary><div class="compact-body">${contactAddressPanelHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Lead intake & data health <span>${leadIntakeItems(c).filter(x=>x.done).length}/${leadIntakeItems(c).length}</span></summary><div class="compact-body">${leadIntakeHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Transaction file <span>${transactionsForContact(c.id).length}</span></summary><div class="compact-body">${transactionContactPanelHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Properties & opportunities <span>${propertiesForContact(c.id).length}</span></summary><div class="compact-body property-panel-body">${propertyCardsHtml(c)}</div></details>

        <details class="compact-panel" open><summary>${c.type==="Seller"?"Seller opportunity":c.type==="Buyer"?"Buyer criteria":c.type==="Realtor"?"Realtor partner":c.type==="Lender"?"Lending partner":"Sphere relationship"} <span>${esc(c.type)}</span></summary><div class="compact-body detail-grid">${typeSpecificHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Household & decision makers <span>${(c.household||[]).length}</span></summary><div class="compact-body household-panel-body">${householdHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Upcoming tasks <span>${tasks.length}</span></summary><div class="compact-body">
          ${tasks.length?tasks.slice(0,5).map(t=>`<div class="sidebar-task"><input type="checkbox" data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)} • ${dateLabel(t.due)}</small></div></div>`).join(""):`<div class="compact-empty"><span>No open tasks.</span><button class="ghost-btn compact" data-action="open-task" data-id="${c.id}">＋ Add task</button></div>`}
          ${tasks.length?`<button class="ghost-btn compact full-width" data-action="open-task" data-id="${c.id}">＋ Add another task</button>`:""}
        </div></details>

        <details class="compact-panel"><summary>Property activity & alerts <span>${(c.behaviors||[]).length}</span></summary><div class="compact-body">
          ${(c.behaviors||[]).length?(c.behaviors||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4).map(b=>`<div class="side-activity"><div><strong>${esc(b.type)}</strong><small>${esc(b.property||b.details||"")}</small></div><span>${dateLabel(b.date)}</span></div>`).join(""):`<div class="compact-empty"><span>No property activity recorded.</span><button class="ghost-btn compact" data-action="open-behavior" data-id="${c.id}">＋ Add activity</button></div>`}
          <button class="ghost-btn compact full-width" data-action="open-alerts" data-id="${c.id}">${c.alertSettings.propertyAlert||c.alertSettings.marketSnapshot?"Manage alerts":"Set property / market alert"}</button>
        </div></details>

        <details class="compact-panel"><summary>Action plans <span>${runs.length}</span></summary><div class="compact-body">
          ${runs.length?runs.map(run=>{const p=planById(run.planId);return `<div class="side-activity"><div><strong>${esc(p?.name||"Plan")}</strong><small>Started ${dateLabel(run.startedAt)}</small></div><span class="badge ${run.status==="Active"?"good":"warn"}">${esc(run.status)}</span></div>`}).join(""):`<div class="compact-empty"><span>No active action plan.</span><button class="ghost-btn compact" data-action="apply-plan" data-id="${c.id}">Apply plan</button></div>`}
        </div></details>

        <details class="compact-panel"><summary>Relationship notes <span>${c.notes?"Saved":"Empty"}</span></summary><div class="compact-body notes-copy">${esc(c.notes||"No relationship notes yet.")}</div></details>
      </aside>
    </div>`;
}
function detail(label,value){return `<div class="detail"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`}
function contactSummary(c,s){
  const first=c.firstName||fullName(c);
  const pieces=[];
  if(["Realtor","Lender"].includes(c.type)){
    const d=c.professionalDetails||{};
    pieces.push(`${first} is a ${c.type.toLowerCase()} referral partner${d.company?` with ${d.company}`:""}.`);
  }else if(!c.lastCommunication)pieces.push(`${first} is a new ${c.type.toLowerCase()} contact with no communication history.`);
  else pieces.push(`${first} is a ${c.heat.toLowerCase()} ${c.type.toLowerCase()} contact currently in ${c.stage}.`);
  if(c.timeframe&&c.timeframe!=="Unknown")pieces.push(`Timing: ${c.timeframe.toLowerCase()}.`);
  else pieces.push("Timing is still unknown.");
  if(contactAddressDisplay(c))pieces.push(`Contact address: ${contactAddressDisplay(c)}.`);
  if(propertyDisplay(c))pieces.push(`${c.type==="Buyer"?"Target":"Property"}: ${propertyDisplay(c)}.`);
  const spouse=spouseMember(c);
  if(spouse)pieces.push(`${householdName(spouse)} is listed as ${spouse.relationship.toLowerCase()}${spouse.decisionMaker?" and a decision maker":""}.`);
  const high=(c.behaviors||[]).filter(b=>["Requested Showing","Home Valuation","Repeated Property View","Saved Property"].includes(b.type)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  if(high)pieces.push(`Recent signal: ${high.type.toLowerCase()}${high.property?` — ${high.property}`:""}.`);
  pieces.push(c.followUp?`Next follow-up: ${dateLabel(c.followUp)}.`:"No next follow-up is scheduled.");
  return pieces.join(" ")
}
function timelineHtml(c,comms,tasks=[]){
  const entries=[
    ...comms.map(m=>({type:m.channel,title:`${m.direction==="inbound"?"Inbound":"Outbound"} ${m.channel}`,body:[m.outcome,m.body].filter(Boolean).join(" • "),date:m.date,status:"activity"})),
    ...(c.behaviors||[]).map(b=>({type:"Behavior",title:b.type,body:b.property||b.details||"",date:`${b.date}T12:00:00`,status:"behavior"})),
    ...tasks.map(t=>({type:"Task",title:t.title,body:`${t.type} • Due ${dateLabel(t.due)}`,date:`${t.due}T08:00:00`,status:"task",taskId:t.id}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(!entries.length)return contactEmptyTimeline(c);
  return entries.map(e=>`<div class="timeline-item ${e.status}">
    <span class="timeline-icon">${e.type==="Call"?"☎":e.type==="Text"?"✉":e.type==="Email"?"@":e.type==="Behavior"?"◉":e.type==="Task"?"✓":e.type==="Appointment"?"◆":"✎"}</span>
    <div><strong>${esc(e.title)}</strong><p>${esc(e.body||"No details")}</p></div>
    <div class="timeline-right"><time>${dateTimeLabel(e.date)}</time>${e.taskId?`<button class="mini-complete" data-action="complete-task-button" data-id="${e.taskId}">Complete</button>`:""}</div>
  </div>`).join("")
}


function activeCallQueueIndex(queue){
  const resume=db.settings.callQueueResumeContactId;
  const index=resume?queue.findIndex(x=>x.c.id===resume):-1;
  return index>=0?index:Math.min(state.callIndex,Math.max(0,queue.length-1))
}
function launchQueueCall(contactId,taskId=""){
  const c=contact(contactId);if(!c||!hasPhone(c))return;
  savePendingTouch({contactId,channel:"Call",startedAt:NOW(),taskId,queueMode:true,returnRoute:"#/call-queue"});
  db.settings.callQueueResumeContactId=contactId;save(false);
  location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`;
  setTimeout(()=>showPendingTouchPrompt(),900)
}
function moveCallQueue(direction=1){
  const queue=callQueue();if(!queue.length)return;
  let index=activeCallQueueIndex(queue)+Number(direction||1);
  if(index>=queue.length)index=0;if(index<0)index=queue.length-1;
  db.settings.callQueueResumeContactId=queue[index].c.id;state.callIndex=index;save(false);renderCallQueue()
}
function renderCallQueue(){
  const queue=callQueue(),index=activeCallQueueIndex(queue),active=queue[index];
  if(active)db.settings.callQueueResumeContactId=active.c.id;
  document.getElementById("view").innerHTML=
    pageHead("Focused outreach","Call Queue","Call, capture the outcome, set the next date, and continue without losing your place.",`<button class="ghost-btn" data-action="create-call-tasks">Build from due follow-ups</button>`) +
    `<section class="call-session card">
      <div class="call-session-progress"><div><span>${queue.length?`CALL ${index+1} OF ${queue.length}`:"QUEUE CLEAR"}</span><div class="call-progress-track"><i style="width:${queue.length?((index+1)/queue.length*100):100}%"></i></div></div><div><button class="ghost-btn compact" data-action="call-prev">← Previous</button><button class="ghost-btn compact" data-action="call-next">Skip →</button></div></div>
      ${active?`<div class="call-active">
        <div class="call-person">${avatar(active.c)}<div><h2>${esc(fullName(active.c))}</h2><p>${esc(active.c.type)} • ${esc(active.c.stage)} • ${esc(active.c.heat)} • Score ${scoreContact(active.c).score}</p><span>${esc(active.task?.title||"Follow-up due")} • ${dateLabel(active.task?.due||active.c.followUp)}</span></div></div>
        <div class="call-summary">${esc(contactSummary(active.c,scoreContact(active.c)))}</div>
        <div class="call-session-actions">
          <button class="primary-btn call-big" data-action="queue-call" data-id="${active.c.id}" data-task="${active.task?.id||""}">☎ Call ${esc(active.c.firstName||"contact")}</button>
          <button class="ghost-btn script-launch" data-action="show-script" data-id="${active.c.id}" data-context="call-queue" data-task="${active.task?.id||""}">▤ Show script</button>
          <button class="ghost-btn" data-action="quick-launch" data-channel="Text" data-id="${active.c.id}">✉ Text</button>
          <button class="ghost-btn" data-action="open-note" data-id="${active.c.id}">＋ Note</button>
          <a class="ghost-btn" href="#/contact/${active.c.id}">Open profile</a>
        </div>
      </div>`:`<div class="work-clear"><strong>No calls are due.</strong><span>Add a call task or a next follow-up date.</span></div>`}
    </section>
    <section class="card call-list-panel"><div class="card-head card-pad"><div><h2>Queue</h2><small>Your place is saved across refreshes and devices.</small></div><b>${queue.length}</b></div>
      ${queue.length?queue.map((x,i)=>`<div class="queue-row ${i===index?"active":""}">${avatar(x.c)}<div><strong><a class="person-name-link" href="#/contact/${x.c.id}">${esc(fullName(x.c))}</a></strong><small>${esc(x.c.type)} • ${esc(x.c.stage)} • ${esc(x.task?.title||"Follow-up due")}</small></div><button class="ghost-btn compact" data-action="select-call" data-index="${i}">${i===index?"Current":"Select"}</button></div>`).join(""):`<div class="empty">Queue complete.</div>`}
    </section>`
}

function renderPipeline(){
  const stages=state.pipelineType==="Seller"?sellerStages:buyerStages;
  const contacts=db.contacts.filter(c=>c.type===state.pipelineType&&!["Lost"].includes(c.stage));
  document.getElementById("view").innerHTML=
    pageHead("Lead-to-close visibility","Pipeline","Drag cards between stages. Seller and buyer workflows stay separate.",`<button class="${state.pipelineType==="Seller"?"primary-btn":"ghost-btn"}" data-action="pipeline-type" data-id="Seller">Seller</button><button class="${state.pipelineType==="Buyer"?"primary-btn":"ghost-btn"}" data-action="pipeline-type" data-id="Buyer">Buyer</button>`) +
    `<div class="kanban-wrap"><div class="kanban">${stages.map(stage=>{const items=contacts.filter(c=>c.stage===stage);return `<section class="kanban-column" data-stage="${esc(stage)}"><div class="kanban-head"><span>${esc(stage)}</span><b>${items.length}</b></div>${items.map(c=>`<article class="deal-card" draggable="true" data-contact="${c.id}"><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.property||"No property")} • ${c.lastCommunication?`Last touch ${dateLabel(c.lastCommunication)}`:"Never contacted"}</small>${transactionsForContact(c.id).filter(tx=>!["Closed","Terminated"].includes(tx.status)).map(tx=>{const p=transactionProgress(tx),h=transactionHealth(tx);return `<a class="pipeline-transaction-link" href="#/transaction/${tx.id}"><span>${tx.closingDate?`Close ${dateLabel(tx.closingDate)}`:"Setup dates"}</span><b>${p.pct}%</b><i class="tx-health ${h.className}">${h.label}</i></a>`}).join("")}<div class="deal-meta"><span>${money(c.gci)}</span><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></div></article>`).join("")}</section>`}).join("")}</div></div>`;
}


function allPlans(){
  const map=new Map(defaultPlans.map(p=>[p.id,p]));
  (db.actionPlans||[]).forEach(p=>map.set(p.id,p));
  return [...map.values()]
}
function planById(id){return allPlans().find(p=>p.id===id)}
function personalizeTemplate(text,c){
  const values={
    first_name:c?.firstName||"",
    last_name:c?.lastName||"",
    full_name:c?fullName(c):"",
    property:c?propertyDisplay(c)||"your property":"your property",
    agent_name:db.settings.agentName||"Jacob",
    agent_email:db.settings.agentEmail||"",
    agent_phone:db.settings.agentPhone||"",
    company:"Holton Homes"
  };
  return String(text||"").replace(/\{\{(\w+)\}\}/g,(match,key)=>values[key]??match)
}
function automationLog({kind="Rule",name="",contactId="",status="Completed",detail="",sourceId=""}){
  db.automationLogs.unshift({id:uid(),kind,name,contactId,status,detail,sourceId,date:NOW()});
  db.automationLogs=db.automationLogs.slice(0,1000)
}
function scheduleAutomationEvaluation(){
  clearTimeout(automationTimer);
  automationTimer=setTimeout(()=>processAutomationEngine(),120)
}
function contactFingerprint(c){
  const lastBehavior=(c.behaviors||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  const lastInbound=db.communications.filter(m=>m.contactId===c.id&&m.direction==="inbound").sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  return [c.stage,c.heat,c.followUp,c.lastCommunication,c.updatedAt,(c.tags||[]).slice().sort().join(","),lastBehavior?.type,lastBehavior?.date,lastInbound?.date].join("|")
}
function ruleHistoryKey(rule,c,manual=false){
  if(manual)return `${rule.id}:${c.id}:manual:${Date.now()}`;
  if(rule.runMode==="daily")return `${rule.id}:${c.id}:${TODAY()}`;
  if(rule.runMode==="monthly")return `${rule.id}:${c.id}:${TODAY().slice(0,7)}`;
  if(rule.runMode==="changed")return `${rule.id}:${c.id}:${contactFingerprint(c)}`;
  return `${rule.id}:${c.id}:once`
}
function recentBehavior(c,type,days=7){
  const high=["Saved Property","Repeated Property View","Requested Showing","Home Valuation","Clicked Property Alert"];
  return (c.behaviors||[]).some(b=>{
    const typeMatch=type==="High Intent"?high.includes(b.type):!type||b.type===type;
    return typeMatch&&daysSince(b.date)<=days
  })
}
function triggerMatches(rule,c){
  if(rule.trigger==="Manual")return false;
  if(rule.trigger==="Contact Created")return daysSince(c.createdAt)===0;
  if(rule.trigger==="Behavior")return recentBehavior(c,rule.filters?.behaviorType||"High Intent",7);
  if(rule.trigger==="Inbound Reply")return db.communications.some(m=>m.contactId===c.id&&m.direction==="inbound"&&String(m.date).slice(0,10)===TODAY());
  if(rule.trigger==="Task Completed")return db.tasks.some(t=>t.contactId===c.id&&t.completedAt===TODAY());
  if(rule.trigger==="Follow-Up Due")return Boolean(c.followUp&&c.followUp<=TODAY());
  if(rule.trigger==="Stale")return true;
  if(rule.trigger==="Stage Match")return true;
  if(rule.trigger==="Always")return true;
  return true
}
function matchesAutomationFilters(rule,c){
  const f=rule.filters||{};
  if(Array.isArray(f.types)&&f.types.length&&!f.types.includes(c.type))return false;
  if(f.type&&c.type!==f.type)return false;
  if(f.stage&&c.stage!==f.stage)return false;
  if(f.heat&&c.heat!==f.heat)return false;
  if(f.source&&c.source!==f.source)return false;
  if(f.tag&&!c.tags.some(t=>t.toLowerCase()===String(f.tag).toLowerCase()))return false;
  if(f.noContactDays!==""&&f.noContactDays!=null&&daysSince(c.lastCommunication)<Number(f.noContactDays))return false;
  if(f.minScore!==""&&f.minScore!=null&&scoreContact(c).score<Number(f.minScore))return false;
  if(f.behaviorType&&!recentBehavior(c,f.behaviorType,7))return false;
  return true
}
function matchingContactsForRule(rule,includeTrigger=true){
  return db.contacts.filter(c=>matchesAutomationFilters(rule,c)&&(!includeTrigger||triggerMatches(rule,c)))
}
function addTagDirect(c,value){
  const clean=normalizeTag(value);
  if(clean&&!c.tags.some(t=>t.toLowerCase()===clean.toLowerCase()))c.tags.push(clean)
}
function createAutomationTask(c,title,type="Follow Up",due=TODAY(),planRunId="",sourceKey=""){
  if(db.tasks.some(t=>t.contactId===c.id&&t.status!=="Done"&&t.title===title&&t.due===due))return null;
  const task={id:uid(),contactId:c.id,title,type,due,status:"Open",priority:type==="Call"||c.heat==="Hot"?"High":"Normal",planRunId,sourceKey,completedAt:"",createdAt:TODAY()};
  db.tasks.unshift(task);return task
}
function queueAutomationMessage(c,channel,title,body,subject="",source="",sourceId="",due=TODAY()){
  const key=`${source}:${sourceId}:${c.id}:${channel}`;
  const existing=db.automationQueue.find(q=>q.dedupeKey===key&&["Needs Review","Ready"].includes(q.status));
  if(existing)return existing;
  const item={id:uid(),contactId:c.id,channel,title:personalizeTemplate(title,c),subject:personalizeTemplate(subject,c),body:personalizeTemplate(body,c),status:"Needs Review",createdAt:NOW(),due,source,sourceId,dedupeKey:key,sentAt:"",skipReason:""};
  db.automationQueue.unshift(item);
  createAutomationTask(c,`Review & send ${channel.toLowerCase()}: ${item.title}`,channel,due,"",`queue:${item.id}`);
  return item
}
function startPlanForContact(contactId,planId,start=TODAY(),sourceRuleId=""){
  const c=contact(contactId),p=planById(planId);
  if(!c||!p)return {ok:false,reason:"Missing contact or plan"};
  const existing=db.planRuns.find(r=>r.contactId===contactId&&r.planId===planId&&r.status==="Active");
  if(existing)return {ok:false,reason:"Plan already active",run:existing};
  const run={id:uid(),contactId,planId,status:"Active",startedAt:start,stepStates:{},sourceRuleId,completedAt:"",pausedAt:"",pauseReason:""};
  db.planRuns.unshift(run);
  automationLog({kind:"Plan",name:p.name,contactId,status:"Started",detail:sourceRuleId?"Started by automation rule.":"Started manually.",sourceId:run.id});
  return {ok:true,run}
}
function executeAutomationAction(rule,c,action){
  const type=action.type,value=action.value||"",extra=action.extra||"";
  if(type==="Start Plan")return startPlanForContact(c.id,value,TODAY(),rule.id).ok?`Started ${planById(value)?.name||value}`:`Plan not started`;
  if(type==="Create Task"){createAutomationTask(c,personalizeTemplate(value,c),extra||"Follow Up",TODAY(),"",`rule:${rule.id}`);return `Created task: ${value}`}
  if(type==="Add Tag"){addTagDirect(c,value);return `Added tag ${value}`}
  if(type==="Remove Tag"){c.tags=c.tags.filter(t=>t.toLowerCase()!==String(value).toLowerCase());return `Removed tag ${value}`}
  if(type==="Set Heat"){c.heat=value;return `Set heat to ${value}`}
  if(type==="Set Stage"){c.stage=value;return `Set stage to ${value}`}
  if(type==="Set Follow-Up"){c.followUp=addDays(TODAY(),Number(value||0));return `Set follow-up ${dateLabel(c.followUp)}`}
  if(type==="Add Note"){db.communications.unshift({id:uid(),contactId:c.id,channel:"Note",direction:"outbound",outcome:"Automation",body:personalizeTemplate(value,c),date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});return "Added note"}
  if(type==="Pause Plans"){pauseReplyPlans(c.id,"Paused by automation");return "Paused active plans"}
  if(type==="Queue Text"){queueAutomationMessage(c,"Text",extra||"Automation text",value,"","Rule",rule.id,TODAY());return "Queued text for review"}
  if(type==="Queue Email"){queueAutomationMessage(c,"Email",extra||"Automation email",value,action.subject||extra,"Rule",rule.id,TODAY());return "Queued email for review"}
  return `Skipped unknown action ${type}`
}
function runAutomationRule(rule,c,{manual=false}={}){
  const key=ruleHistoryKey(rule,c,manual);
  if(!manual&&db.automationHistory.includes(key))return false;
  const details=[];
  (rule.actions||[]).forEach(action=>details.push(executeAutomationAction(rule,c,action)));
  db.automationHistory.push(key);
  db.automationHistory=db.automationHistory.slice(-5000);
  c.updatedAt=TODAY();
  automationLog({kind:"Rule",name:rule.name,contactId:c.id,status:"Completed",detail:details.join(" • "),sourceId:rule.id});
  return true
}
function executePlanStep(run,p,c,step){
  const stateForStep=run.stepStates[step.id];
  if(stateForStep?.status)return false;
  const due=addDays(run.startedAt,Number(step.day||0));
  if(due>TODAY())return false;
  let status="Completed",detail="";
  if(["Task","Call","Follow Up","Appointment"].includes(step.type)){
    const t=createAutomationTask(c,personalizeTemplate(step.title,c),step.type,due,run.id,`plan:${run.id}:${step.id}`);
    detail=t?`Created ${step.type.toLowerCase()} task`:"Task already exists"
  }else if(step.type==="Text"||step.type==="Email"){
    const item=queueAutomationMessage(c,step.type,step.title,step.body||"",step.subject||"",`Plan`,`${run.id}:${step.id}`,due);
    status="Queued";detail=`Queued ${step.type.toLowerCase()} for human review`;
    run.stepStates[step.id]={status,executedAt:NOW(),queueId:item.id,detail};return true
  }else if(step.type==="Add Tag"){addTagDirect(c,step.body||step.title);detail="Tag added"}
  else if(step.type==="Remove Tag"){c.tags=c.tags.filter(t=>t.toLowerCase()!==String(step.body||step.title).toLowerCase());detail="Tag removed"}
  else if(step.type==="Set Stage"){c.stage=step.body||step.title;detail=`Stage set to ${c.stage}`}
  else if(step.type==="Set Heat"){c.heat=step.body||step.title;detail=`Heat set to ${c.heat}`}
  else if(step.type==="Set Follow-Up"){c.followUp=addDays(TODAY(),Number(step.body||0));detail=`Follow-up set to ${dateLabel(c.followUp)}`}
  else if(step.type==="Note"){db.communications.unshift({id:uid(),contactId:c.id,channel:"Note",direction:"outbound",outcome:"Action Plan",body:personalizeTemplate(step.body||step.title,c),date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});detail="Note added"}
  else {status="Skipped";detail=`Unsupported step type: ${step.type}`}
  run.stepStates[step.id]={status,executedAt:NOW(),detail};
  automationLog({kind:"Plan Step",name:`${p.name}: ${step.title}`,contactId:c.id,status,detail,sourceId:run.id});
  return true
}
function processPlanRuns(){
  let changed=false;
  db.planRuns.forEach(run=>{
    if(run.status!=="Active")return;
    const c=contact(run.contactId),p=planById(run.planId);
    if(!c||!p){run.status="Failed";run.pauseReason="Missing contact or plan";changed=true;return}
    if((p.goalStages||[]).includes(c.stage)){
      run.status="Completed — goal reached";run.completedAt=NOW();
      automationLog({kind:"Plan",name:p.name,contactId:c.id,status:"Completed",detail:`Stopped because ${c.stage} reached the plan goal.`,sourceId:run.id});
      changed=true;return
    }
    (p.steps||[]).forEach(step=>{if(executePlanStep(run,p,c,step))changed=true});
    const finished=(p.steps||[]).every(step=>run.stepStates[step.id]?.status);
    if(finished){run.status="Completed";run.completedAt=NOW();automationLog({kind:"Plan",name:p.name,contactId:c.id,status:"Completed",detail:"All plan steps were created or queued.",sourceId:run.id});changed=true}
  });
  return changed
}
function processAutomationRules(){
  let changed=false,runs=0;
  (db.automationRules||[]).filter(rule=>rule.active).forEach(rule=>{
    matchingContactsForRule(rule,true).forEach(c=>{
      if(runs>=100)return;
      if(runAutomationRule(rule,c)){changed=true;runs++}
    })
  });
  return changed
}
function processAutomationEngine({manual=false}={}){
  if(automationBusy)return;
  automationBusy=true;
  try{
    const planChanged=processPlanRuns();
    const ruleChanged=processAutomationRules();
    if(planChanged||ruleChanged){
      save(false);
      if(state.route==="automations")renderAutomations()
    }else if(manual){
      automationLog({kind:"Engine",name:"Manual automation check",status:"Completed",detail:"No new matching actions were found."});
      save(false);
      if(state.route==="automations")renderAutomations()
    }
  }catch(error){
    console.error(error);
    automationLog({kind:"Engine",name:"Automation engine",status:"Failed",detail:error.message||String(error)});
    save(false)
  }finally{automationBusy=false}
}
function automationConditionSummary(rule){
  const f=rule.filters||{},parts=[];
  if(Array.isArray(f.types)&&f.types.length)parts.push(`type is ${f.types.join(" or ")}`);
  if(f.type)parts.push(`type is ${f.type}`);
  if(f.stage)parts.push(`stage is ${f.stage}`);
  if(f.heat)parts.push(`heat is ${f.heat}`);
  if(f.source)parts.push(`source is ${f.source}`);
  if(f.tag)parts.push(`tagged ${f.tag}`);
  if(f.noContactDays!=="")parts.push(`no communication for ${f.noContactDays}+ days`);
  if(f.minScore!=="")parts.push(`score ≥ ${f.minScore}`);
  if(f.behaviorType)parts.push(`${f.behaviorType} behavior`);
  return parts.length?parts.join(" AND "):"All contacts matching the trigger"
}
function automationActionSummary(rule){
  return (rule.actions||[]).map(a=>`${a.type}${a.value?`: ${planById(a.value)?.name||a.value}`:""}`).join(" → ")
}
function planProgress(run){
  const p=planById(run.planId);if(!p)return {done:0,total:0,pct:0};
  const done=(p.steps||[]).filter(s=>run.stepStates?.[s.id]?.status).length,total=(p.steps||[]).length;
  return {done,total,pct:total?Math.round(done/total*100):0}
}
function automationHealth(){
  const waiting=db.automationQueue.filter(q=>q.status==="Needs Review");
  return {
    missingChannels:waiting.filter(q=>{const c=contact(q.contactId);return q.channel==="Text"?!hasPhone(c):!hasEmail(c)}).length,
    failedLogs:db.automationLogs.filter(l=>l.status==="Failed"&&daysSince(l.date)<=30).length,
    duplicateRuns:db.planRuns.filter((run,i,arr)=>run.status==="Active"&&arr.findIndex(r=>r.contactId===run.contactId&&r.planId===run.planId&&r.status==="Active")!==i).length
  }
}
function automationOverviewHtml(){
  const rules=db.automationRules||[],activeRules=rules.filter(r=>r.active).length,activeRuns=db.planRuns.filter(r=>r.status==="Active").length,waiting=db.automationQueue.filter(q=>q.status==="Needs Review").length,completed30=db.automationLogs.filter(l=>l.status==="Completed"&&daysSince(l.date)<=30).length,health=automationHealth();
  const recent=db.automationLogs.slice(0,8);
  return `<section class="automation-metrics">
    <div class="automation-metric"><label>Active rules</label><strong>${activeRules}</strong><small>${rules.length-activeRules} disabled</small></div>
    <div class="automation-metric"><label>Running plans</label><strong>${activeRuns}</strong><small>${db.planRuns.filter(r=>String(r.status).startsWith("Paused")).length} paused</small></div>
    <div class="automation-metric"><label>Approval queue</label><strong>${waiting}</strong><small>Nothing sends blindly</small></div>
    <div class="automation-metric"><label>Completed in 30 days</label><strong>${completed30}</strong><small>Rules and plan steps</small></div>
  </section>
  <section class="automation-hero">
    <div><span>HOLTON AUTOMATION STANDARD</span><h2>Automate the reminder. Keep the relationship human.</h2><p>Every rule explains why it matched. Every message waits for review. Replies and real conversations pause nurture. Listing and contract workflows live beside lead follow-up.</p></div>
    <button class="primary-btn" data-action="run-engine">Run engine now</button>
  </section>
  <div class="grid two">
    <section class="card card-pad"><div class="card-head"><div><h2>Automation health</h2><small>Problems are visible instead of silently failing.</small></div></div>
      <div class="health-list">
        <div><span>Missing phone/email for queued messages</span><b class="${health.missingChannels?"health-bad":"health-good"}">${health.missingChannels}</b></div>
        <div><span>Failed runs in the last 30 days</span><b class="${health.failedLogs?"health-bad":"health-good"}">${health.failedLogs}</b></div>
        <div><span>Duplicate active plans</span><b class="${health.duplicateRuns?"health-bad":"health-good"}">${health.duplicateRuns}</b></div>
        <div><span>Rules ready to run</span><b class="health-good">${activeRules}</b></div>
      </div>
    </section>
  </div>
  <section class="card card-pad" style="margin-top:12px"><div class="card-head"><div><h2>Recent automation activity</h2><small>A clear record of what ran and why.</small></div><button class="ghost-btn compact" data-action="automation-tab" data-id="logs">View all logs</button></div>${automationLogsTable(recent)}</section>`
}
function automationRulesHtml(){
  const rules=db.automationRules||[];
  return `<section class="automation-toolbar"><div><strong>${rules.length} rules</strong><span>Rules run on app open, data changes, or a manual engine check.</span></div><button class="primary-btn" data-action="open-rule-builder">＋ New rule</button></section>
  <section class="rule-list">${rules.map(rule=>{
    const matches=matchingContactsForRule(rule,true);
    return `<article class="rule-card ${rule.active?"active":"disabled"}">
      <div class="rule-status"><button class="automation-toggle ${rule.active?"on":""}" data-action="toggle-rule" data-id="${rule.id}" aria-label="Toggle ${esc(rule.name)}"><span></span></button></div>
      <div class="rule-main"><div class="rule-title"><span class="trigger-pill">${esc(rule.trigger)}</span><h3>${esc(rule.name)}</h3></div><p>${esc(rule.description||"")}</p>
        <div class="rule-flow"><div><label>WHEN</label><strong>${esc(rule.trigger)}</strong></div><i>→</i><div><label>IF</label><strong>${esc(automationConditionSummary(rule))}</strong></div><i>→</i><div><label>THEN</label><strong>${esc(automationActionSummary(rule))}</strong></div></div>
      </div>
      <div class="rule-side"><b>${matches.length}</b><span>match now</span><div class="rule-actions"><button class="quick" data-action="preview-rule" data-id="${rule.id}">Preview</button><button class="quick" data-action="run-rule" data-id="${rule.id}">Run</button><button class="quick" data-action="open-rule-builder" data-id="${rule.id}">Edit</button><button class="quick" data-action="duplicate-rule" data-id="${rule.id}">Duplicate</button></div></div>
    </article>`
  }).join("")}</section>`
}
function planStepLabel(step){return `Day ${step.day} • ${step.type}`}
function automationPlansHtml(){
  const plans=allPlans();
  return `<section class="automation-toolbar"><div><strong>${plans.length} action plans</strong><span>Tasks execute automatically; texts and emails enter the approval queue.</span></div><button class="primary-btn" data-action="open-plan-builder">＋ New action plan</button></section>
    <div class="advanced-plan-grid">${plans.map(p=>{
      const runs=db.planRuns.filter(r=>r.planId===p.id),active=runs.filter(r=>r.status==="Active").length;
      return `<article class="advanced-plan-card">
        <div class="advanced-plan-head"><span class="badge ${p.category==="Seller"?"seller":p.category==="Buyer"?"buyer":""}">${esc(p.category)}</span><span>${active} active</span></div>
        <h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p>
        <div class="plan-guardrails"><span>${p.pauseOnReply?"✓ Pauses on reply":"○ Continues after reply"}</span><span>${(p.goalStages||[]).length?`✓ Stops at ${esc(p.goalStages[0])}`:"○ No conversion stop"}</span></div>
        <div class="plan-sequence">${(p.steps||[]).slice(0,6).map(step=>`<div><b>${esc(planStepLabel(step))}</b><span>${esc(step.title)}</span></div>`).join("")}${(p.steps||[]).length>6?`<small>＋ ${(p.steps||[]).length-6} more steps</small>`:""}</div>
        <div class="plan-card-actions"><button class="primary-btn compact" data-action="apply-plan" data-plan="${p.id}">Apply</button><button class="ghost-btn compact" data-action="open-plan-builder" data-id="${p.id}">Edit</button><button class="ghost-btn compact" data-action="duplicate-plan" data-id="${p.id}">Duplicate</button></div>
      </article>`
    }).join("")}</div>
    <section class="card card-pad" style="margin-top:12px"><div class="card-head"><div><h2>Running plans</h2><small>Progress, pauses, and goals are visible.</small></div></div>${db.planRuns.length?db.planRuns.map(run=>{
      const c=contact(run.contactId),p=planById(run.planId),progress=planProgress(run);
      return `<div class="plan-run-row"><div><strong>${esc(p?.name||"Missing plan")} — ${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Deleted contact"}</strong><small>${esc(run.status)} • Started ${dateLabel(run.startedAt)}${run.pauseReason?` • ${esc(run.pauseReason)}`:""}</small></div><div class="run-progress"><span><i style="width:${progress.pct}%"></i></span><b>${progress.done}/${progress.total}</b></div><button class="quick" data-action="toggle-plan-run" data-id="${run.id}">${run.status==="Active"?"Pause":"Resume"}</button></div>`
    }).join(""):`<div class="empty">No plans have been applied yet.</div>`}</section>`
}
function automationQueueHtml(){
  const queue=[...db.automationQueue].sort((a,b)=>(a.status==="Needs Review"?0:1)-(b.status==="Needs Review"?0:1)||String(b.createdAt).localeCompare(String(a.createdAt)));
  return `<section class="automation-toolbar"><div><strong>${queue.filter(q=>q.status==="Needs Review").length} messages need review</strong><span>Personalized drafts solve batch-work pain without risking robotic spam.</span></div><div><button class="ghost-btn" data-action="build-batch-queue">Build batch queue</button><button class="primary-btn" data-action="process-next-queue">Process next</button></div></section>
    <section class="queue-board">${queue.length?queue.map(item=>{
      const c=contact(item.contactId),missing=item.channel==="Text"?!hasPhone(c):!hasEmail(c);
      return `<article class="approval-item ${item.status.toLowerCase().replaceAll(" ","-")}">
        <div class="approval-channel ${item.channel.toLowerCase()}">${item.channel==="Text"?"✉":"@"}</div>
        <div class="approval-copy"><div><strong>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Deleted contact"} — ${esc(item.title)}</strong><span class="badge ${item.status==="Needs Review"?"warn":item.status==="Sent"?"good":""}">${esc(item.status)}</span></div><p>${esc(item.body)}</p><small>${esc(item.source)} • Due ${dateLabel(item.due)}${missing?" • Missing contact channel":""}</small></div>
        <div class="approval-actions"><button class="quick" data-action="open-queue-item" data-id="${item.id}">Review</button>${item.status==="Needs Review"?`<button class="quick" data-action="skip-queue-item" data-id="${item.id}">Skip</button>`:""}</div>
      </article>`
    }).join(""):`<div class="empty">The approval queue is clear.</div>`}</section>`
}
function automationLogsTable(logs=db.automationLogs){
  return logs.length?`<div class="automation-log-table"><div class="log-head"><span>Time</span><span>Automation</span><span>Person</span><span>Result</span><span>Details</span></div>${logs.map(log=>{
    const c=contact(log.contactId);
    return `<div class="log-row"><time>${dateTimeLabel(log.date)}</time><div><b>${esc(log.name)}</b><small>${esc(log.kind)}</small></div><span>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"—"}</span><span class="badge ${log.status==="Failed"?"hot":log.status==="Completed"||log.status==="Started"?"good":"warn"}">${esc(log.status)}</span><p>${esc(log.detail||"")}</p></div>`
  }).join("")}</div>`:`<div class="empty">No automation activity yet.</div>`
}
function automationLogsHtml(){
  return `<section class="automation-toolbar"><div><strong>Audit trail</strong><span>Every run is explainable and reversible through the contact record.</span></div><button class="ghost-btn" data-action="clear-automation-logs">Clear logs</button></section>${automationLogsTable(db.automationLogs)}`
}
function renderTasks(){
  let tasks=[...db.tasks];
  if(state.taskFilter==="open")tasks=tasks.filter(t=>t.status!=="Done");
  if(state.taskFilter==="overdue")tasks=tasks.filter(t=>t.status!=="Done"&&t.due<TODAY());
  if(state.taskFilter==="today")tasks=tasks.filter(t=>t.status!=="Done"&&t.due===TODAY());
  if(state.taskFilter==="upcoming")tasks=tasks.filter(t=>t.status!=="Done"&&t.due>TODAY());
  if(state.taskFilter==="done")tasks=tasks.filter(t=>t.status==="Done");
  tasks.sort((a,b)=>a.due.localeCompare(b.due));
  document.getElementById("view").innerHTML=
    pageHead("Specific commitments","Tasks","Use tasks for promises and transaction deadlines; use Smart Lists for general follow-up.",`<button class="primary-btn" data-action="open-task">＋ Add task</button>`) +
    `<div class="toolbar">${["open","overdue","today","upcoming","done"].map(x=>`<button class="${state.taskFilter===x?"primary-btn":"ghost-btn"} compact" data-action="task-filter" data-id="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join("")}</div>
    <section class="card">${tasks.length?tasks.map(t=>{const c=contact(t.contactId);return `<div class="task-row ${t.status==="Done"?"done":""}"><input type="checkbox" ${t.status==="Done"?"checked":""} data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)}${c?` • <a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:""}${t.planRunId?" • Action plan":""}</small></div><span class="task-date ${t.status!=="Done"&&t.due<TODAY()?"overdue":""}">${dateLabel(t.due)}</span><button class="quick" data-action="delete-task" data-id="${t.id}">×</button></div>`}).join(""):`<div class="empty">No tasks in this view.</div>`}</section>`;
}

function renderAutomations(){
  const tabs=[["overview","Overview"],["rules","Rules"],["plans","Action Plans"],["queue","Approval Queue"],["logs","Logs"]];
  const body=
    state.automationTab==="rules"?automationRulesHtml():
    state.automationTab==="plans"?automationPlansHtml():
    state.automationTab==="queue"?automationQueueHtml():
    state.automationTab==="logs"?automationLogsHtml():
    automationOverviewHtml();
  document.getElementById("view").innerHTML=
    backupWarningHtml()+
    pageHead(
      "Automation",
      "Automation Studio",
      "Rules, follow-up plans, message drafts, and transaction checklists.",
      `<button class="ghost-btn" data-action="run-engine">Run engine</button><button class="primary-btn" data-action="open-rule-builder">＋ New rule</button>`
    )+
    `<nav class="automation-tabs">${tabs.map(([id,label])=>{
      const waiting=id==="queue"?db.automationQueue.filter(q=>q.status==="Needs Review").length:0;
      return `<button class="${state.automationTab===id?"active":""}" data-action="automation-tab" data-id="${id}">${label}${waiting?` <b>${waiting}</b>`:""}</button>`
    }).join("")}</nav>${body}`;
}

function renderActivity(){
  const entries=[];
  db.communications.forEach(m=>entries.push({date:m.date,kind:m.channel,contact:contact(m.contactId),title:`${m.direction==="inbound"?"Inbound":"Outbound"} ${m.channel}`,detail:[m.outcome,m.body].filter(Boolean).join(" • ")}));
  db.contacts.forEach(c=>(c.behaviors||[]).forEach(b=>entries.push({date:`${b.date}T12:00:00`,kind:"Behavior",contact:c,title:b.type,detail:b.property||b.details||""})));
  entries.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  document.getElementById("view").innerHTML=
    pageHead("Communication and intent","Activity","Calls, texts, emails, notes, appointments, and property activity.",`<button class="primary-btn" data-action="open-communication" data-channel="Note">＋ Log activity</button>`) +
    `<section class="card"><div class="timeline" style="padding:0 12px">${entries.length?entries.map(e=>`<div class="timeline-item"><span class="timeline-icon">${e.kind==="Call"?"☎":e.kind==="Text"?"✉":e.kind==="Email"?"@":e.kind==="Behavior"?"◉":"✎"}</span><div><strong>${e.contact?`<a class="person-name-link" href="#/contact/${e.contact.id}">${esc(fullName(e.contact))}</a> — `:""}${esc(e.title)}</strong><p>${esc(e.detail||"No details")}</p></div><time>${dateTimeLabel(e.date)}</time></div>`).join(""):`<div class="empty">No activity yet.</div>`}</div></section>`;
}

function renderReports(){
  const open=db.contacts.filter(isOpen),closed=db.contacts.filter(c=>c.stage==="Closed"),communications7=db.communications.filter(m=>daysSince(m.date)<=7),connected=db.communications.filter(m=>m.channel==="Call"&&["Connected","Appointment Set"].includes(m.outcome)).length,calls=db.communications.filter(m=>m.channel==="Call").length;
  const sourceMap={};db.contacts.forEach(c=>{sourceMap[c.source]??={count:0,gci:0};sourceMap[c.source].count++;sourceMap[c.source].gci+=c.gci});
  const stageMap={};db.contacts.forEach(c=>stageMap[c.stage]=(stageMap[c.stage]||0)+1);
  document.getElementById("view").innerHTML=
    pageHead("Business intelligence","Reports","Measure relationship work, pipeline, source performance, and listing focus.") +
    `<section class="metric-grid"><div class="metric"><label>Active transactions</label><strong>${activeTransactions().length}</strong><small>Buyer and seller sides</small></div><div class="metric"><label>Transaction deadlines</label><strong>${transactionDeadlineItems().length}</strong><small>Due, overdue, or problems</small></div><div class="metric"><label>Work Today</label><strong>${workQueueItems().length}</strong><small>Open priority items</small></div><div class="metric"><label>Database</label><strong>${db.contacts.length}</strong><small>Total people</small></div><div class="metric"><label>Seller share</label><strong>${db.contacts.length?Math.round(db.contacts.filter(c=>c.type==="Seller").length/db.contacts.length*100):0}%</strong><small>Listing-focused mix</small></div><div class="metric"><label>Activity this week</label><strong>${communications7.length}</strong><small>Logged touches</small></div><div class="metric"><label>Call connect rate</label><strong>${calls?Math.round(connected/calls*100):0}%</strong><small>Connected or appointment</small></div><div class="metric"><label>Closed GCI</label><strong>${money(closed.reduce((s,c)=>s+c.gci,0))}</strong><small>Recorded closings</small></div><div class="metric"><label>Possible duplicates</label><strong>${possibleDuplicateIds().size}</strong><small>Records to review</small></div></section>
    <div class="grid two"><section class="card card-pad"><div class="card-head"><div><h2>Lead sources</h2><small>People and projected GCI by source.</small></div></div>${barChart(Object.entries(sourceMap).map(([label,v])=>({label,value:v.count,display:`${v.count} • ${money(v.gci)}`})))}</section>
    <section class="card card-pad"><div class="card-head"><div><h2>Stage funnel</h2><small>Where relationships are sitting.</small></div></div>${barChart(Object.entries(stageMap).map(([label,value])=>({label,value,display:value})))}</section></div>
    <div class="grid two" style="margin-top:10px"><section class="card card-pad"><div class="card-head"><div><h2>Estimated from open opportunities GCI</h2><small>Seller vs. buyer opportunity.</small></div></div>${barChart(["Seller","Buyer"].map(type=>({label:type,value:open.filter(c=>c.type===type).reduce((s,c)=>s+c.gci,0),display:money(open.filter(c=>c.type===type).reduce((s,c)=>s+c.gci,0))})))}</section>
    <section class="card card-pad"><div class="card-head"><div><h2>Data health</h2><small>Missing information that weakens follow-up.</small></div></div>${barChart([{label:"No follow-up",value:open.filter(c=>!c.followUp).length},{label:"No contact address",value:open.filter(c=>!contactAddressComplete(c)).length},{label:"No phone/email",value:open.filter(c=>!hasPhone(c)&&!hasEmail(c)).length},{label:"Unknown timeframe",value:open.filter(c=>c.timeframe==="Unknown").length},{label:"Stale 14+ days",value:open.filter(c=>daysSince(c.lastCommunication)>=14).length}])}</section></div>`;
}
function barChart(data){const max=Math.max(1,...data.map(x=>Number(x.value)||0));return `<div class="chart">${data.length?data.sort((a,b)=>b.value-a.value).map(x=>`<div class="bar-row"><label>${esc(x.label)}</label><div class="track"><div class="fill" style="width:${Math.max(2,(Number(x.value)||0)/max*100)}%"></div></div><b>${esc(x.display??x.value)}</b></div>`).join(""):`<div class="empty">No data yet.</div>`}</div>`}

function renderSettings(){
  document.getElementById("view").innerHTML=
    pageHead("Data and preferences","Settings","Manage cloud sync, templates, recovery, goals, and backups.") +
    `<div class="settings-grid">
      ${cloudSettingsHtml()}
      ${templatesSettingsHtml()}
      ${callScriptsSettingsHtml()}
      ${transactionResourcesSettingsHtml()}
      <section class="setting-card recently-deleted"><div class="setting-card-head"><div><h3>Recently Deleted</h3><p>Restore contacts removed by mistake.</p></div><b>${db.deletedContacts.length}</b></div>
        <div class="deleted-list">${db.deletedContacts.length?db.deletedContacts.slice(0,10).map(item=>`<div class="deleted-row"><div><strong>${esc(fullName(item.contact))}</strong><span>Deleted ${dateTimeLabel(item.deletedAt)}</span></div><button class="ghost-btn compact" data-action="restore-deleted" data-id="${item.id}">Restore</button><button class="quick" data-action="permanent-delete" data-id="${item.id}">×</button></div>`).join(""):`<div class="compact-empty">No deleted contacts.</div>`}</div>
      </section>
      <section class="setting-card"><h3>Agent profile</h3><p>Used in the daily dashboard and future message templates.</p><div class="field"><label>Agent name</label><input id="settingAgentName" value="${esc(db.settings.agentName||"")}"></div><div class="field" style="margin-top:7px"><label>Email</label><input id="settingAgentEmail" value="${esc(db.settings.agentEmail||"")}"></div><div class="field" style="margin-top:7px"><label>Phone</label><input id="settingAgentPhone" value="${esc(db.settings.agentPhone||"")}"></div><button class="primary-btn compact" style="margin-top:9px" data-action="save-settings">Save</button></section>
      <section class="setting-card"><h3>Export backup</h3><p>Download all contacts, communications, tasks, behavior, and plans.</p><button class="primary-btn compact" data-action="export-json">Export JSON</button><button class="ghost-btn compact" data-action="export-csv">Export people CSV</button></section>
      <section class="setting-card"><h3>Import backup</h3><p>Restore a JSON backup created by this CRM.</p><input id="importFile" type="file" accept=".json"><button class="ghost-btn compact" style="margin-top:9px" data-action="import-json">Import</button></section>
      <section class="setting-card"><h3>Holton Homes goals</h3><p>These targets shape the Today dashboard and keep the CRM focused on production.</p>
        <div class="field"><label>Annual GCI target</label><input id="settingGciTarget" type="number" value="${esc(db.settings.annualGciTarget||100000)}"></div>
        <div class="field" style="margin-top:8px"><label>Seller share goal (%)</label><input id="settingSellerShare" type="number" min="0" max="100" value="${esc(db.settings.sellerShareGoal||60)}"></div>
        <div class="field" style="margin-top:8px"><label>Daily conversation target</label><input id="settingConversationTarget" type="number" min="1" value="${esc(db.settings.dailyConversationTarget||5)}"></div>
        <div class="field" style="margin-top:8px"><label>Core markets</label><textarea id="settingCoreMarkets">${esc(db.settings.coreMarkets||"")}</textarea></div>
        <button class="primary-btn compact" style="margin-top:9px" data-action="save-goals">Save goals</button>
      </section>
      <section class="setting-card"><h3>Data protection</h3><p>The cloud is the shared source of truth. This browser also keeps a local recovery copy for offline use.</p><div class="warning"><strong>Still recommended:</strong> download a JSON backup monthly. Free cloud plans do not replace your own exports.</div><button class="ghost-btn compact" style="margin-top:9px" data-action="request-persistent-storage">Protect browser storage</button><div id="storageProtectionStatus" class="storage-status"></div></section>
      <section class="setting-card"><h3>CRM foundation</h3><p>The same contacts, households, properties, tasks, notes, and plans now sync across signed-in devices.</p><div class="cloud-roadmap"><span>✓ Secure login</span><span>✓ Shared cloud database</span><span>✓ Phone and computer sync</span><span>✓ Universal Conversation Mode</span><span>✓ Synced call-note drafts</span><span>✓ Local offline cache</span><span>○ Two-way business texting</span><span>○ In-browser calling</span></div></section>
      <section class="setting-card"><h3>Device cache</h3><p>Clear only this device’s local cache. Your signed-in cloud data will download again.</p><button class="danger-btn compact" data-action="clear-data">Clear device cache</button></section>
    </div>`;
}

function modal(title,body,footer){const backdrop=document.getElementById("modalBackdrop"),el=document.getElementById("modal");el.classList.remove("script-modal");el.innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close-modal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${footer||`<button class="ghost-btn" data-action="close-modal">Close</button>`}</div>`;backdrop.classList.add("open")}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open");document.getElementById("modal")?.classList.remove("script-modal")}
function contactOptions(selected=""){return `<option value="">Choose person</option>${db.contacts.slice().sort((a,b)=>fullName(a).localeCompare(fullName(b))).map(c=>`<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(fullName(c))}</option>`).join("")}`}


function contactSpecificForm(c,type){
  if(type==="Seller"){
    const d=c.sellerDetails||{},p=primaryProperty(c)||{};
    return `<div class="field full section-label">Seller lead intake</div>
      <div class="field full"><label>Street address</label><input id="sellerPropertyStreet" value="${esc(p.street||(!p.city?c.property||"":""))}"></div>
      <div class="field"><label>Unit</label><input id="sellerPropertyUnit" value="${esc(p.unit||"")}"></div>
      <div class="field"><label>City</label><input id="sellerPropertyCity" value="${esc(p.city||"")}"></div>
      <div class="field"><label>State</label><input id="sellerPropertyState" value="${esc(p.state||"OH")}"></div>
      <div class="field"><label>ZIP</label><input id="sellerPropertyZip" value="${esc(p.zip||"")}"></div>
      <div class="field"><label>County</label><input id="sellerPropertyCounty" value="${esc(p.county||"")}"></div>
      <div class="field"><label>Property type</label><select id="sellerPropertyType">${["Single Family","Farm","Acreage / Land","Condo","Townhome","Multi-Family","Manufactured","Commercial","Other"].map(x=>`<option ${(p.propertyType||"Single Family")===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Occupancy</label><select id="sellerPropertyOccupancy">${["Unknown","Owner Occupied","Tenant Occupied","Vacant","Second Home"].map(x=>`<option ${(p.occupancy||"Unknown")===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Ownership</label><select id="sellerPropertyOwnership">${["Unknown","Sole","Joint","Trust","Estate","LLC","Other"].map(x=>`<option ${(p.ownership||"Unknown")===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Beds</label><input id="sellerPropertyBeds" type="number" step=".5" value="${esc(p.beds||"")}"></div>
      <div class="field"><label>Baths</label><input id="sellerPropertyBaths" type="number" step=".5" value="${esc(p.baths||"")}"></div>
      <div class="field"><label>Square feet</label><input id="sellerPropertySqft" type="number" value="${esc(p.sqft||"")}"></div>
      <div class="field"><label>Acres</label><input id="sellerPropertyAcres" type="number" step=".01" value="${esc(p.acres||"")}"></div>
      <div class="field"><label>Year built</label><input id="sellerPropertyYear" type="number" value="${esc(p.yearBuilt||"")}"></div>
      <div class="field full section-label">Motivation, money, and appointment</div>
      <div class="field"><label>Motivation</label><input id="sellerMotivation" value="${esc(p.motivation||d.motivation||"")}"></div>
      <div class="field"><label>Estimated value</label><input id="sellerEstimatedValue" type="number" value="${esc(p.estimatedValue||d.estimatedValue||"")}"></div>
      <div class="field"><label>Mortgage balance</label><input id="sellerMortgageBalance" type="number" value="${esc(p.mortgageBalance||d.mortgageBalance||"")}"></div>
      <div class="field"><label>Condition</label><input id="sellerCondition" value="${esc(p.condition||d.condition||"")}"></div>
      <div class="field"><label>Target move/list date</label><input id="sellerTargetDate" type="date" value="${esc(p.targetDate||"")}"></div>
      <div class="field"><label>Listing appointment</label><input id="sellerAppointmentDate" type="date" value="${esc(p.appointmentDate||"")}"></div>
      <div class="field full"><label>Decision makers</label><input id="sellerDecisionMakers" value="${esc(d.decisionMakers||"")}" placeholder="Add spouse/partner in the household section after saving"></div>`;
  }
  if(type==="Buyer"){
    const d=c.buyerDetails||{};
    return `<div class="field full section-label">Buyer criteria</div>
      <div class="field"><label>Preapproval</label><select id="buyerPreapproval">${["Unknown","Not Started","In Progress","Pre-Approved","Cash"].map(x=>`<option ${d.preapproval===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Lender</label><input id="buyerLender" value="${esc(d.lender||"")}"></div>
      <div class="field"><label>Budget</label><input id="buyerBudget" type="number" value="${esc(d.budget||"")}"></div>
      <div class="field"><label>Desired monthly payment</label><input id="buyerDesiredPayment" type="number" value="${esc(d.desiredPayment||"")}"></div>
      <div class="field full"><label>Target areas</label><input id="buyerAreas" value="${esc(d.areas||"")}"></div>
      <div class="field"><label>Beds</label><input id="buyerBeds" value="${esc(d.beds||"")}"></div>
      <div class="field"><label>Baths</label><input id="buyerBaths" value="${esc(d.baths||"")}"></div>
      <div class="field"><label>Lease expiration</label><input id="buyerLeaseExpiration" type="date" value="${esc(d.leaseExpiration||"")}"></div>`;
  }
  if(["Realtor","Lender"].includes(type)){
    const d=c.professionalDetails||{};
    return `<div class="field full section-label">${type==="Realtor"?"Realtor partner":"Lending partner"}</div>
      <div class="field"><label>Company</label><input id="professionalCompany" value="${esc(d.company||"")}"></div>
      <div class="field"><label>Role</label><input id="professionalRole" value="${esc(d.role||type)}"></div>
      <div class="field"><label>${type==="Lender"?"NMLS number":"License number"}</label><input id="professionalLicenseNumber" value="${esc(d.licenseNumber||"")}"></div>
      <div class="field"><label>Service area</label><input id="professionalServiceArea" value="${esc(d.serviceArea||"")}"></div>
      <div class="field full"><label>Specialties</label><input id="professionalSpecialties" value="${esc(d.specialties||"")}" placeholder="${type==="Realtor"?"Luxury, farms, relocation":"FHA, VA, USDA, first-time buyers"}"></div>
      <div class="field full"><label>Referral notes</label><textarea id="professionalReferralNotes">${esc(d.referralNotes||"")}</textarea></div>`;
  }
  const d=c.sphereDetails||{};
  return `<div class="field full section-label">Sphere relationship</div>
    <div class="field"><label>Relationship</label><input id="sphereRelationship" value="${esc(d.relationship||"")}" placeholder="Friend, family, neighbor, former coworker"></div>
    <div class="field"><label>Homeowner</label><select id="sphereHomeowner">${["Unknown","Yes","No"].map(x=>`<option ${d.homeowner===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Neighborhood</label><input id="sphereNeighborhood" value="${esc(d.neighborhood||"")}"></div>
    <div class="field"><label>Birthday</label><input id="sphereBirthday" type="date" value="${esc(d.birthday||"")}"></div>
    <div class="field full"><label>Likely opportunity</label><input id="sphereLikelyOpportunity" value="${esc(d.likelyOpportunity||"")}" placeholder="Future seller, buyer, referral source"></div>`;
}

function openContactModal(id=""){
  const c=contact(id)||{},type=c.type||"Seller",address=contactAddressObject(c);
  modal(c.id?"Edit person":"Add person",`<div class="form-grid">
    <input type="hidden" id="contactId" value="${esc(c.id||"")}">
    <div class="field"><label>First name</label><input id="contactFirst" value="${esc(c.firstName||"")}" autocomplete="given-name"></div>
    <div class="field"><label>Last name</label><input id="contactLast" value="${esc(c.lastName||"")}" autocomplete="family-name"></div>
    <div class="field"><label>Phone</label><input id="contactPhone" value="${esc(c.phone||"")}" type="tel"></div>
    <div class="field"><label>Email</label><input id="contactEmail" value="${esc(c.email||"")}" type="email"></div>
    <div class="field full section-label contact-address-section">Contact / mailing address <small>Where this person lives or receives mail—not necessarily the property being sold.</small></div>
    <div class="field"><label>Address type</label><select id="contactAddressType">${["Home","Mailing","Work","Other"].map(x=>`<option ${address.type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field address-sync-field"><label>Property sync</label><label class="checkbox-row"><input id="contactAddressSameAsProperty" type="checkbox" ${address.sameAsPrimaryProperty?"checked":""}> Keep synced to primary property</label></div>
    <div class="field full"><label>Street address</label><input id="contactAddressStreet" value="${esc(address.street||"")}" autocomplete="street-address"></div>
    <div class="field"><label>Unit / apartment</label><input id="contactAddressUnit" value="${esc(address.unit||"")}"></div>
    <div class="field"><label>City</label><input id="contactAddressCity" value="${esc(address.city||"")}" autocomplete="address-level2"></div>
    <div class="field"><label>State</label><input id="contactAddressState" value="${esc(address.state||"OH")}" autocomplete="address-level1"></div>
    <div class="field"><label>ZIP</label><input id="contactAddressZip" value="${esc(address.zip||"")}" autocomplete="postal-code"></div>
    <div class="field"><label>County</label><input id="contactAddressCounty" value="${esc(address.county||"")}"></div>
    <div class="field address-copy-field"><label>Quick fill</label><button type="button" class="ghost-btn compact" data-action="fill-contact-address-from-property">Use primary property address</button></div>
    <div class="field"><label>Type</label><select id="contactType">${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stage</label><select id="contactStage">${(type==="Buyer"?buyerStages:sellerStages).map(x=>`<option ${c.stage===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Heat</label><select id="contactHeat">${["Hot","Warm","Cold"].map(x=>`<option ${c.heat===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Timeframe</label><select id="contactTimeframe">${["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"].map(x=>`<option ${(c.timeframe||"Unknown")===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Next follow-up</label><input id="contactFollowUp" type="date" value="${esc(c.followUp||TODAY())}"></div>
    <div class="field"><label>Source</label><select id="contactSource">${sources.map(x=>`<option ${c.source===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Estimated from open opportunities GCI</label><input id="contactGci" type="number" min="0" value="${c.gci||""}"></div>
    <div class="field full"><label>Tags</label><input id="contactTags" value="${esc((c.tags||[]).join(", "))}" placeholder="Type tags separated by commas: farm, referral partner, hot lead"><small class="field-help">Tags appear as clickable bubbles throughout the CRM.</small></div>
    <div id="contactSpecificFields" class="field full specific-fields-grid">${contactSpecificForm(c,type)}</div>
    <div class="field full"><label>Relationship notes</label><textarea id="contactNotes">${esc(c.notes||"")}</textarea></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-contact">Save person</button>`);
}
function saveContact(){
  const id=document.getElementById("contactId").value||uid(),firstName=document.getElementById("contactFirst").value.trim(),lastName=document.getElementById("contactLast").value.trim();
  if(!firstName||!lastName){alert("First and last name are required.");return}
  const old=contact(id),type=document.getElementById("contactType").value,stage=document.getElementById("contactStage").value,followUp=document.getElementById("contactFollowUp").value;
  const propertyValue=type==="Buyer"?(document.getElementById("buyerAreas")?.value.trim()||old?.property||""):
    ["Sphere","Past Client"].includes(type)?(document.getElementById("sphereNeighborhood")?.value.trim()||old?.property||""):
    ["Realtor","Lender"].includes(type)?(document.getElementById("professionalServiceArea")?.value.trim()||old?.property||""):
    old?.property||"";
  if(["Seller","Buyer"].includes(type)&&!["Closed","Lost"].includes(stage)&&!followUp){alert("Every open seller or buyer needs a next follow-up date.");return}
  const address={
    type:document.getElementById("contactAddressType").value,
    street:document.getElementById("contactAddressStreet").value.trim(),
    unit:document.getElementById("contactAddressUnit").value.trim(),
    city:document.getElementById("contactAddressCity").value.trim(),
    state:document.getElementById("contactAddressState").value.trim()||"OH",
    zip:document.getElementById("contactAddressZip").value.trim(),
    county:document.getElementById("contactAddressCounty").value.trim(),
    sameAsPrimaryProperty:document.getElementById("contactAddressSameAsProperty").checked
  };
  const c={id,firstName,lastName,name:`${firstName} ${lastName}`,phone:document.getElementById("contactPhone").value.trim(),email:document.getElementById("contactEmail").value.trim(),address,type,stage,heat:document.getElementById("contactHeat").value,timeframe:document.getElementById("contactTimeframe").value,followUp,lastCommunication:old?.lastCommunication||"",source:document.getElementById("contactSource").value,gci:Number(document.getElementById("contactGci").value||0),property:propertyValue,tags:document.getElementById("contactTags").value.split(",").map(x=>x.trim()).filter(Boolean),notes:document.getElementById("contactNotes").value.trim(),createdAt:old?.createdAt||TODAY(),updatedAt:TODAY(),household:old?.household||[],preferences:old?.preferences||{areas:"",minPrice:"",maxPrice:"",beds:"",baths:""},
  sellerDetails:type==="Seller"?{motivation:document.getElementById("sellerMotivation")?.value.trim()||"",estimatedValue:document.getElementById("sellerEstimatedValue")?.value||"",mortgageBalance:document.getElementById("sellerMortgageBalance")?.value||"",condition:document.getElementById("sellerCondition")?.value.trim()||"",decisionMakers:document.getElementById("sellerDecisionMakers")?.value.trim()||""}:(old?.sellerDetails||{motivation:"",estimatedValue:"",mortgageBalance:"",condition:"",decisionMakers:""}),
  buyerDetails:type==="Buyer"?{preapproval:document.getElementById("buyerPreapproval")?.value||"Unknown",lender:document.getElementById("buyerLender")?.value.trim()||"",budget:document.getElementById("buyerBudget")?.value||"",desiredPayment:document.getElementById("buyerDesiredPayment")?.value||"",areas:document.getElementById("buyerAreas")?.value.trim()||"",beds:document.getElementById("buyerBeds")?.value||"",baths:document.getElementById("buyerBaths")?.value||"",leaseExpiration:document.getElementById("buyerLeaseExpiration")?.value||""}:(old?.buyerDetails||{preapproval:"Unknown",lender:"",budget:"",desiredPayment:"",areas:"",beds:"",baths:"",leaseExpiration:""}),
  sphereDetails:["Sphere","Past Client"].includes(type)?{relationship:document.getElementById("sphereRelationship")?.value.trim()||"",homeowner:document.getElementById("sphereHomeowner")?.value||"Unknown",neighborhood:document.getElementById("sphereNeighborhood")?.value.trim()||"",birthday:document.getElementById("sphereBirthday")?.value||"",likelyOpportunity:document.getElementById("sphereLikelyOpportunity")?.value.trim()||""}:(old?.sphereDetails||{relationship:"",birthday:"",neighborhood:"",homeowner:"Unknown",likelyOpportunity:""}),
  professionalDetails:["Realtor","Lender"].includes(type)?{company:document.getElementById("professionalCompany")?.value.trim()||"",role:document.getElementById("professionalRole")?.value.trim()||type,licenseNumber:document.getElementById("professionalLicenseNumber")?.value.trim()||"",serviceArea:document.getElementById("professionalServiceArea")?.value.trim()||"",specialties:document.getElementById("professionalSpecialties")?.value.trim()||"",referralNotes:document.getElementById("professionalReferralNotes")?.value.trim()||""}:(old?.professionalDetails||{company:"",role:"",licenseNumber:"",serviceArea:"",specialties:"",referralNotes:""}),
  alertSettings:old?.alertSettings||{propertyAlert:false,marketSnapshot:false,criteria:"",frequency:"Weekly",lastSent:""},behaviors:old?.behaviors||[]};
  const i=db.contacts.findIndex(x=>x.id===id);if(i>=0)db.contacts[i]=c;else db.contacts.unshift(c);
  applyStageWorkflow(c,old?.stage||"",c.stage);
  syncPrimaryPropertyFromSellerForm(c);
  syncContactAddressFromPrimaryProperty(c);
  const primary=primaryProperty(c);
  if(primary?.appointmentDate&&!db.tasks.some(t=>t.contactId===c.id&&t.type==="Appointment"&&t.due===primary.appointmentDate&&t.status!=="Done")){
    db.tasks.unshift({id:uid(),contactId:c.id,title:`Listing appointment — ${propertyAddress(primary)||fullName(c)}`,type:"Appointment",due:primary.appointmentDate,status:"Open",priority:"High",planRunId:"",completedAt:"",createdAt:TODAY()})
  }
  save();closeModal();toast("Person saved",fullName(c));location.hash=`#/contact/${c.id}`
}

function savePendingTouch(payload){
  sessionStorage.setItem("holtonPendingTouch",JSON.stringify(payload))
}
function pendingTouch(){
  try{return JSON.parse(sessionStorage.getItem("holtonPendingTouch")||"null")}catch{return null}
}
function clearPendingTouch(){sessionStorage.removeItem("holtonPendingTouch")}
function quickLaunch(channel,id){
  const c=contact(id);if(!c)return;
  const destination=channel==="Email"?c.email:c.phone;
  if(!destination){toast(`No ${channel==="Email"?"email":"phone number"}`,`Add one to ${fullName(c)} first.`);return}
  savePendingTouch({contactId:id,channel,startedAt:NOW()});
  if(channel==="Call")location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Text")location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Email")location.href=`mailto:${c.email}?subject=${encodeURIComponent("Holton Homes follow-up")}`;
  setTimeout(()=>showPendingTouchPrompt(),900)
}
function showPendingTouchPrompt(){
  const pending=pendingTouch();
  if(!pending||document.getElementById("modalBackdrop")?.classList.contains("open"))return;
  const c=contact(pending.contactId);if(!c){clearPendingTouch();return}
  postTouchModal(c.id,pending.channel)
}
function postTouchModal(contactId,channel){
  const c=contact(contactId);if(!c)return;
  const outcomes=channel==="Call"
    ?["Connected","Left Voicemail","No Answer","Appointment Set","Follow-Up Needed"]
    :channel==="Text"
      ?["Sent","Replied","No Reply Yet","Appointment Set","Follow-Up Needed"]
      :["Sent","Replied","No Reply Yet","Appointment Set","Follow-Up Needed"];
  modal(`Log ${channel.toLowerCase()} with ${fullName(c)}`,`<div class="post-touch">
    <div class="post-touch-person">${avatar(c)}<div><strong>${esc(fullName(c))}</strong><span>${esc(channel==="Email"?c.email:c.phone)}</span></div></div>
    <div class="form-grid">
      <div class="field"><label>Outcome</label><select id="postTouchOutcome">${outcomes.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Next follow-up</label><input id="postTouchFollowUp" type="date" value="${addDays(TODAY(),channel==="Call"?2:3)}"></div>
      <div class="field full"><label>Notes</label><textarea id="postTouchNotes" placeholder="What happened? Motivation, objections, questions, and next step..."></textarea></div>
    </div>
  </div>`,`<button class="ghost-btn" data-action="dismiss-pending-touch">Not completed</button><button class="primary-btn" data-action="save-pending-touch" data-id="${contactId}" data-channel="${channel}">Save ${channel.toLowerCase()}</button>`)
}
function savePendingTouchLog(contactId,channel){
  const c=contact(contactId);if(!c)return;
  const outcome=document.getElementById("postTouchOutcome").value,
    followUp=document.getElementById("postTouchFollowUp").value,
    body=document.getElementById("postTouchNotes").value.trim();
  db.communications.unshift({
    id:uid(),contactId,channel,direction:"outbound",outcome,body,date:NOW(),
    unread:false,threadStatus:"open",createdAt:NOW()
  });
  c.lastCommunication=TODAY();c.updatedAt=TODAY();if(followUp)c.followUp=followUp;
  if(outcome==="Appointment Set")c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";
  if(["Left Voicemail","No Answer","No Reply Yet","Follow-Up Needed"].includes(outcome)&&followUp&&!db.tasks.some(t=>t.contactId===contactId&&t.status!=="Done"&&t.due===followUp)){
    db.tasks.unshift({id:uid(),contactId,title:`Follow up with ${fullName(c)}`,type:channel,due:followUp,status:"Open",priority:c.heat==="Hot"?"High":"Normal",planRunId:"",createdAt:TODAY()})
  }
  const pending=pendingTouch();
  if(pending?.taskId){const t=task(pending.taskId);if(t){t.status="Done";t.completedAt=TODAY()}}
  if(pending?.workItemId){delete db.workSnoozes[pending.workItemId];db.workHistory.unshift({id:uid(),itemId:pending.workItemId,contactId,action:"Communication logged",date:NOW()})}
  clearPendingTouch();save();closeModal();toast(`${channel} logged`,fullName(c));
  if(pending?.queueMode){
    const remaining=callQueue();db.settings.callQueueResumeContactId=remaining[0]?.c.id||"";location.hash="#/call-queue";setTimeout(renderCallQueue,0)
  }else if(pending?.returnRoute){location.hash=pending.returnRoute;setTimeout(route,0)}else route()
}


function communicationModal(contactId="",channel="Call"){
  const c=contact(contactId);
  modal(`${channel} ${c?fullName(c):"activity"}`,`<div class="channel-tabs">${["Call","Text","Email","Note"].map(x=>`<button class="channel-tab ${channel===x?"active":""}" data-action="switch-channel" data-id="${x}" data-contact="${contactId}">${x}</button>`).join("")}</div>
  <div class="form-grid">
    <div class="field full"><label>Person</label><select id="commContact">${contactOptions(contactId)}</select></div>
    <input type="hidden" id="commChannel" value="${esc(channel)}">
    ${["Text","Email"].includes(channel)?templateOptions(channel,c):""}
    ${channel==="Call"?`<div class="field"><label>Call outcome</label><select id="commOutcome"><option>Connected</option><option>Left Voicemail</option><option>No Answer</option><option>Appointment Set</option><option>Follow-Up Needed</option></select></div>`:`<div class="field"><label>Direction</label><select id="commDirection"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select></div>`}
    ${channel==="Email"?`<div class="field"><label>Subject</label><input id="commSubject" placeholder="Follow-up"></div>`:""}
    <div class="field full"><label>${channel==="Note"?"Note":"Message / call notes"}</label><textarea id="commBody" placeholder="${channel==="Text"?"Write the text you want to send...":channel==="Email"?"Write the email body...":"What happened and what matters next?"}"></textarea></div>
    <div class="field"><label>Next follow-up</label><input id="commFollowUp" type="date" value="${addDays(TODAY(),channel==="Call"?2:3)}"></div>
    ${channel==="Call"?`<div class="field"><label>Launch</label><button class="quick call" type="button" data-action="launch-channel" data-channel="Call" data-id="${contactId}">☎ Open phone app</button></div>`:""}
  </div>
  ${["Call","Text","Email"].includes(channel)?`<div class="warning" style="margin-top:9px">The CRM launches your phone, text, or email app and records the outcome here. True two-way in-app communication still requires a phone/email provider.</div>`:""}`,
  `<button class="ghost-btn" data-action="close-modal">Cancel</button>${channel!=="Note"?`<button class="ghost-btn" data-action="launch-channel" data-channel="${channel}" data-id="${contactId}">Launch ${channel}</button>`:""}<button class="primary-btn" data-action="save-communication">Save & log</button>`)
}

function saveCommunication(){
  const contactId=document.getElementById("commContact").value,c=contact(contactId),channel=document.getElementById("commChannel").value;if(!c){alert("Choose a person.");return}
  const direction=document.getElementById("commDirection")?.value||"outbound",outcome=document.getElementById("commOutcome")?.value||"",body=document.getElementById("commBody").value.trim(),followUp=document.getElementById("commFollowUp").value;
  db.communications.unshift({id:uid(),contactId,channel,direction,outcome,body,date:NOW(),unread:direction==="inbound",threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();if(followUp)c.followUp=followUp;c.updatedAt=TODAY();
  if(direction==="inbound"||(channel==="Note"&&["Connected","Appointment Set","Completed"].includes(outcome)))pauseReplyPlans(contactId,"Paused — real conversation logged");
  if(outcome==="Appointment Set")c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";
  if(["No Answer","Left Voicemail","Follow-Up Needed"].includes(outcome)&&followUp)db.tasks.unshift({id:uid(),contactId,title:`Callback: ${fullName(c)}`,type:"Call",due:followUp,status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});
  if(state.pendingTaskId){const pending=task(state.pendingTaskId);if(pending){pending.status="Done";pending.completedAt=TODAY()}state.pendingTaskId=""}
  save();closeModal();toast("Activity logged",`${channel} with ${fullName(c)}`);route()
}
function launchChannel(channel,id){
  const c=contact(id||document.getElementById("commContact")?.value);if(!c)return;
  const body=document.getElementById("commBody")?.value||"",subject=document.getElementById("commSubject")?.value||"Holton Homes follow-up";
  if(channel==="Call"&&hasPhone(c))location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Text"&&hasPhone(c))location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(body)}`;
  if(channel==="Email"&&hasEmail(c))location.href=`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function openTaskModal(contactId=""){
  modal("Add task",`<div class="form-grid"><div class="field full"><label>Task</label><input id="taskTitle"></div><div class="field"><label>Person</label><select id="taskContact">${contactOptions(contactId)}</select></div><div class="field"><label>Type</label><select id="taskType"><option>Follow Up</option><option>Call</option><option>Text</option><option>Email</option><option>Appointment</option><option>Transaction</option><option>Admin</option></select></div><div class="field"><label>Due date</label><input id="taskDue" type="date" value="${TODAY()}"></div><div class="field"><label>Priority</label><select id="taskPriority"><option>Normal</option><option>High</option><option>Low</option></select></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-task">Save task</button>`)
}
function saveTask(){const title=document.getElementById("taskTitle").value.trim();if(!title){alert("Add a task title.");return}db.tasks.unshift({id:uid(),contactId:document.getElementById("taskContact").value,title,type:document.getElementById("taskType").value,due:document.getElementById("taskDue").value||TODAY(),status:"Open",priority:document.getElementById("taskPriority").value,planRunId:"",createdAt:TODAY()});save();closeModal();toast("Task created",title);route()}

function saveInlineActivity(id){
  const c=contact(id);if(!c)return;
  const channel=document.getElementById("profileComposerChannel").value,
    direction=document.getElementById("profileComposerDirection").value,
    outcome=document.getElementById("profileComposerOutcome").value,
    body=document.getElementById("profileComposerBody").value.trim(),
    followUp=document.getElementById("profileComposerFollowUp").value;
  if(!body&&channel==="Note"){alert("Add a note.");return}
  db.communications.unshift({id:uid(),contactId:id,channel,direction,outcome,body,date:NOW(),unread:direction==="inbound",threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();if(followUp)c.followUp=followUp;c.updatedAt=TODAY();
  if(direction==="inbound"||(channel==="Note"&&["Connected","Appointment Set","Completed"].includes(outcome)))pauseReplyPlans(id,"Paused — real conversation logged");
  if(outcome==="Appointment Set")c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";
  if(["No Answer","Left Voicemail","Follow-Up Needed"].includes(outcome)&&followUp&&!db.tasks.some(t=>t.contactId===id&&t.status!=="Done"&&t.due===followUp&&t.type==="Call"))db.tasks.unshift({id:uid(),contactId:id,title:`Callback: ${fullName(c)}`,type:"Call",due:followUp,status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});
  save();toast("Activity logged",`${channel} with ${fullName(c)}`);renderContact(id);
}
function rescheduleModal(id){
  const c=contact(id);modal("Reschedule follow-up",`<div class="form-grid"><div class="field full"><label>Person</label><input value="${esc(fullName(c))}" disabled></div><div class="field"><label>New follow-up date</label><input id="rescheduleDate" type="date" value="${c.followUp||addDays(TODAY(),3)}"></div><div class="field"><label>Reason / next step</label><input id="rescheduleReason" placeholder="Call about timing, send market update..."></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-reschedule" data-id="${id}">Reschedule</button>`)
}
function saveReschedule(id){
  const c=contact(id),date=document.getElementById("rescheduleDate").value,reason=document.getElementById("rescheduleReason").value.trim();
  if(!date){alert("Choose a follow-up date.");return}
  c.followUp=date;c.updatedAt=TODAY();
  if(reason)db.tasks.unshift({id:uid(),contactId:id,title:reason,type:"Follow Up",due:date,status:"Open",priority:"Normal",planRunId:"",createdAt:TODAY()});
  save();closeModal();toast("Follow-up rescheduled",`${fullName(c)} • ${dateLabel(date)}`);renderContact(id)
}
function completeNextAction(id,channel,taskId){
  state.pendingTaskId=taskId||"";
  communicationModal(id,channel||"Call");
}

function openTagModal(id){
  const c=contact(id);
  modal(`Add tag to ${fullName(c)}`,`<div class="field"><label>Tag</label><input id="newTagValue" placeholder="Referral partner, farm seller, USDA lender..." autofocus></div><div class="suggested-tags"><span>Suggestions</span>${["Referral Partner","Farm","Past Client","VIP","Hot Lead","First-Time Buyer","USDA","FHA","VA","Investor"].map(tag=>`<button class="tag-chip suggestion" data-action="choose-tag" data-tag="${tag}">${tag}</button>`).join("")}</div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-tag" data-id="${id}">Add tag</button>`)
}
function removeTag(id,tag){
  const c=contact(id);if(!c)return;
  c.tags=c.tags.filter(existing=>existing.toLowerCase()!==String(tag).toLowerCase());
  c.updatedAt=TODAY();save();toast("Tag removed",tag);route()
}

function behaviorModal(id){
  modal("Log website / property activity",`<div class="form-grid"><div class="field full"><label>Person</label><select id="behaviorContact">${contactOptions(id)}</select></div><div class="field"><label>Activity</label><select id="behaviorType">${behaviorTypes.map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Date</label><input id="behaviorDate" type="date" value="${TODAY()}"></div><div class="field full"><label>Property / details</label><input id="behaviorProperty" placeholder="Address, search area, or behavior detail"></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-behavior">Save activity</button>`)
}
function saveBehavior(){const c=contact(document.getElementById("behaviorContact").value);if(!c){alert("Choose a person.");return}const type=document.getElementById("behaviorType").value,date=document.getElementById("behaviorDate").value||TODAY(),property=document.getElementById("behaviorProperty").value.trim();c.behaviors.unshift({id:uid(),type,date,property,details:""});if(["Requested Showing","Home Valuation","Repeated Property View"].includes(type)){c.heat="Hot";c.followUp=TODAY();db.tasks.unshift({id:uid(),contactId:c.id,title:`Respond to ${type.toLowerCase()}`,type:"Call",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()})}save();closeModal();toast("Behavior recorded",`${fullName(c)} • ${type}`);route()}
function alertsModal(id){
  const c=contact(id),a=c.alertSettings;
  modal("Property & market alerts",`<div class="warning">This static build tracks alert setup and engagement. Sending live MLS listings requires an IDX/MLS connection.</div><div class="form-grid" style="margin-top:10px"><div class="field"><label>Buyer property alert</label><select id="alertProperty"><option value="false">Off</option><option value="true" ${a.propertyAlert?"selected":""}>On</option></select></div><div class="field"><label>Seller market snapshot</label><select id="alertMarket"><option value="false">Off</option><option value="true" ${a.marketSnapshot?"selected":""}>On</option></select></div><div class="field"><label>Frequency</label><select id="alertFrequency">${["Daily","Twice Weekly","Weekly","Monthly"].map(x=>`<option ${a.frequency===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Criteria / area</label><textarea id="alertCriteria" placeholder="Price, area, beds, baths, property type, or seller neighborhood">${esc(a.criteria||"")}</textarea></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-alerts" data-id="${id}">Save alerts</button>`)
}
function saveAlerts(id){const c=contact(id);c.alertSettings={...c.alertSettings,propertyAlert:document.getElementById("alertProperty").value==="true",marketSnapshot:document.getElementById("alertMarket").value==="true",frequency:document.getElementById("alertFrequency").value,criteria:document.getElementById("alertCriteria").value.trim()};save();closeModal();toast("Alert settings saved",fullName(c));route()}
function planModal(contactId="",planId=""){
  modal("Apply action plan",`<div class="form-grid"><div class="field"><label>Person</label><select id="planContact">${contactOptions(contactId)}</select></div><div class="field"><label>Plan</label><select id="planId">${allPlans().map(p=>`<option value="${p.id}" ${p.id===planId?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div><div class="field"><label>Start date</label><input id="planStart" type="date" value="${TODAY()}"></div><div class="field full"><div class="warning">Tasks are created when due. Texts and emails enter the Approval Queue for review before launching.</div></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-plan-run">Apply plan</button>`)
}
function savePlanRun(){
  const contactId=document.getElementById("planContact").value,planId=document.getElementById("planId").value,start=document.getElementById("planStart").value||TODAY(),p=planById(planId),c=contact(contactId);
  if(!p||!c){alert("Choose a person and plan.");return}
  const result=startPlanForContact(contactId,planId,start,"");
  if(!result.ok){alert(result.reason);return}
  processAutomationEngine();
  save(false);closeModal();toast("Plan applied",`${p.name} • ${fullName(c)}`);route()
}
function pauseReplyPlans(contactId,reason="Paused — replied"){
  db.planRuns.filter(r=>r.contactId===contactId&&r.status==="Active").forEach(r=>{
    const p=planById(r.planId);
    if(p?.pauseOnReply){r.status=reason;r.pausedAt=NOW();r.pauseReason=reason;automationLog({kind:"Plan",name:p.name,contactId,status:"Paused",detail:reason,sourceId:r.id})}
  })
}
function planBuilderModal(planId="",duplicate=false){
  const original=planById(planId),p=original?JSON.parse(JSON.stringify(original)):{id:"",name:"",category:"Seller",description:"",pauseOnReply:true,goalStages:[],steps:[]};
  if(duplicate){p.id="";p.name=`Copy of ${p.name}`}
  const lines=(p.steps||[]).map(s=>`${s.day} | ${s.type} | ${s.title} | ${s.subject||""} | ${(s.body||"").replaceAll("\n"," ↵ ")}`).join("\n");
  modal(p.id?"Edit action plan":"Create action plan",`<div class="form-grid">
    <input type="hidden" id="builderPlanOriginalId" value="${esc(p.id||"")}">
    <div class="field"><label>Plan name</label><input id="builderPlanName" value="${esc(p.name||"")}"></div>
    <div class="field"><label>Category</label><select id="builderPlanCategory">${["Seller","Buyer","Past Client","Partner","Transaction","Custom"].map(x=>`<option ${p.category===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Description</label><input id="builderPlanDescription" value="${esc(p.description||"")}"></div>
    <div class="field"><label>Pause when a real reply is logged</label><select id="builderPlanPause"><option value="true" ${p.pauseOnReply?"selected":""}>Yes</option><option value="false" ${!p.pauseOnReply?"selected":""}>No</option></select></div>
    <div class="field"><label>Stop when stage reaches</label><input id="builderPlanGoals" value="${esc((p.goalStages||[]).join(", "))}" placeholder="Listing Appointment, Closed"></div>
    <div class="field full"><label>Plan steps</label><textarea id="builderPlanSteps" class="code-textarea" placeholder="0 | Call | Call the lead | | Learn motivation and timing">${esc(lines)}</textarea><small class="field-help">One step per line: day | type | title | email subject | message/value. Types: Task, Call, Text, Email, Follow Up, Appointment, Add Tag, Remove Tag, Set Stage, Set Heat, Set Follow-Up, Note.</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-plan-builder">Save action plan</button>`)
}
function parsePlanSteps(text){
  return String(text||"").split(/\n+/).map((line,index)=>{
    const parts=line.split("|").map(x=>x.trim());
    if(parts.length<3||!parts[2])return null;
    return {id:`step-${uid()}`,day:Math.max(0,Number(parts[0]||0)),type:parts[1]||"Task",title:parts[2],subject:parts[3]||"",body:(parts.slice(4).join(" | ")||"").replaceAll(" ↵ ","\n")}
  }).filter(Boolean).sort((a,b)=>a.day-b.day)
}
function savePlanBuilder(){
  const originalId=document.getElementById("builderPlanOriginalId").value,name=document.getElementById("builderPlanName").value.trim();
  if(!name){alert("Name the action plan.");return}
  const steps=parsePlanSteps(document.getElementById("builderPlanSteps").value);
  if(!steps.length){alert("Add at least one valid plan step.");return}
  const id=originalId||`custom-plan-${uid()}`,plan={id,name,category:document.getElementById("builderPlanCategory").value,description:document.getElementById("builderPlanDescription").value.trim(),pauseOnReply:document.getElementById("builderPlanPause").value==="true",goalStages:document.getElementById("builderPlanGoals").value.split(",").map(x=>x.trim()).filter(Boolean),steps};
  const i=db.actionPlans.findIndex(x=>x.id===id);if(i>=0)db.actionPlans[i]=plan;else db.actionPlans.push(plan);
  save();closeModal();state.automationTab="plans";renderAutomations();toast("Action plan saved",name)
}
function ruleBuilderModal(ruleId="",duplicate=false){
  const original=(db.automationRules||[]).find(r=>r.id===ruleId);
  const r=original?JSON.parse(JSON.stringify(original)):{id:"",name:"",description:"",trigger:"Contact Created",active:true,runMode:"once",filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},actions:[{type:"Create Task",value:"Follow up today",extra:"Follow Up"}]};
  if(duplicate){r.id="";r.name=`Copy of ${r.name}`}
  const actionLines=(r.actions||[]).map(a=>`${a.type} | ${a.value||""} | ${a.extra||""} | ${a.subject||""}`).join("\n");
  modal(r.id?"Edit automation rule":"Create automation rule",`<div class="form-grid">
    <input type="hidden" id="builderRuleId" value="${esc(r.id||"")}">
    <div class="field"><label>Rule name</label><input id="builderRuleName" value="${esc(r.name||"")}"></div>
    <div class="field"><label>Trigger</label><select id="builderRuleTrigger">${["Contact Created","Stage Match","Behavior","Follow-Up Due","Stale","Inbound Reply","Task Completed","Manual","Always"].map(x=>`<option ${r.trigger===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Description</label><input id="builderRuleDescription" value="${esc(r.description||"")}"></div>
    <div class="field"><label>Contact type</label><select id="builderRuleType"><option value="">Any</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${r.filters?.type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stage</label><select id="builderRuleStage"><option value="">Any</option>${[...new Set([...sellerStages,...buyerStages])].map(x=>`<option ${r.filters?.stage===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Heat</label><select id="builderRuleHeat"><option value="">Any</option>${["Hot","Warm","Cold"].map(x=>`<option ${r.filters?.heat===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Source</label><select id="builderRuleSource"><option value="">Any</option>${sources.map(x=>`<option ${r.filters?.source===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Required tag</label><input id="builderRuleTag" value="${esc(r.filters?.tag||"")}"></div>
    <div class="field"><label>No communication for days</label><input id="builderRuleNoContact" type="number" min="0" value="${esc(r.filters?.noContactDays??"")}"></div>
    <div class="field"><label>Minimum lead score</label><input id="builderRuleScore" type="number" min="0" max="100" value="${esc(r.filters?.minScore??"")}"></div>
    <div class="field"><label>Behavior signal</label><select id="builderRuleBehavior"><option value="">Any</option><option ${r.filters?.behaviorType==="High Intent"?"selected":""}>High Intent</option>${behaviorTypes.map(x=>`<option ${r.filters?.behaviorType===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Repeat behavior</label><select id="builderRuleRunMode">${[["once","Once per contact"],["changed","When matching data changes"],["daily","At most daily"],["monthly","At most monthly"]].map(([v,l])=>`<option value="${v}" ${r.runMode===v?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select id="builderRuleActive"><option value="true" ${r.active?"selected":""}>Active</option><option value="false" ${!r.active?"selected":""}>Disabled</option></select></div>
    <div class="field full"><label>Actions</label><textarea id="builderRuleActions" class="code-textarea">${esc(actionLines)}</textarea><small class="field-help">One action per line: action | value | extra. Examples: Start Plan | seller-speed · Create Task | Call today | Call · Add Tag | High Intent · Set Follow-Up | 3 · Queue Text | Hi {{first_name}}... | Personal check-in</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-rule-builder">Save rule</button>`)
}
function parseRuleActions(text){
  const allowed=["Start Plan","Create Task","Add Tag","Remove Tag","Set Heat","Set Stage","Set Follow-Up","Add Note","Pause Plans","Queue Text","Queue Email"];
  return String(text||"").split(/\n+/).map(line=>{const p=line.split("|").map(x=>x.trim());if(!p[0]||!allowed.includes(p[0]))return null;return {type:p[0],value:p[1]||"",extra:p[2]||"",subject:p[3]||""}}).filter(Boolean)
}
function saveRuleBuilder(){
  const id=document.getElementById("builderRuleId").value||`custom-rule-${uid()}`,name=document.getElementById("builderRuleName").value.trim(),actions=parseRuleActions(document.getElementById("builderRuleActions").value);
  if(!name){alert("Name the automation rule.");return}
  if(!actions.length){alert("Add at least one valid action.");return}
  const rule={id,name,description:document.getElementById("builderRuleDescription").value.trim(),trigger:document.getElementById("builderRuleTrigger").value,active:document.getElementById("builderRuleActive").value==="true",runMode:document.getElementById("builderRuleRunMode").value,filters:{type:document.getElementById("builderRuleType").value,stage:document.getElementById("builderRuleStage").value,heat:document.getElementById("builderRuleHeat").value,source:document.getElementById("builderRuleSource").value,tag:document.getElementById("builderRuleTag").value.trim(),noContactDays:document.getElementById("builderRuleNoContact").value,minScore:document.getElementById("builderRuleScore").value,behaviorType:document.getElementById("builderRuleBehavior").value},actions};
  const i=db.automationRules.findIndex(x=>x.id===id);if(i>=0)db.automationRules[i]=rule;else db.automationRules.push(rule);
  save();closeModal();state.automationTab="rules";renderAutomations();toast("Automation saved",name)
}
function previewRuleModal(ruleId){
  const rule=db.automationRules.find(r=>r.id===ruleId),matches=matchingContactsForRule(rule,true);
  modal(`Preview: ${rule.name}`,`<div class="preview-summary"><strong>${matches.length} contacts match right now</strong><span>${esc(automationConditionSummary(rule))}</span></div><div class="preview-contact-list">${matches.length?matches.map(c=>`<div>${avatar(c)}<span><b>${esc(fullName(c))}</b><small>${esc(c.type)} • ${esc(c.stage)} • score ${scoreContact(c).score}</small></span></div>`).join(""):`<div class="empty">Nobody currently matches this trigger and its conditions.</div>`}</div>`,`<button class="ghost-btn" data-action="close-modal">Close</button>${matches.length?`<button class="primary-btn" data-action="run-rule" data-id="${ruleId}">Run for these contacts</button>`:""}`)
}
function runRuleNow(ruleId){
  const rule=db.automationRules.find(r=>r.id===ruleId);if(!rule)return;
  const matches=matchingContactsForRule(rule,false);
  if(!matches.length){toast("No matches",rule.name);return}
  if(!confirm(`Run "${rule.name}" for ${matches.length} matching contact(s)? Messages will be queued for review.`))return;
  let count=0;matches.forEach(c=>{if(runAutomationRule(rule,c,{manual:true}))count++});
  processPlanRuns();save(false);closeModal();renderAutomations();toast("Rule completed",`${count} contacts processed`)
}
function batchQueueModal(){
  const tags=[...new Set(db.contacts.flatMap(c=>c.tags))].sort();
  modal("Build personalized batch queue",`<div class="warning">This creates one personalized draft per person. It does not secretly blast messages. Review consent, relevance, and the final wording before launching each message.</div><div class="form-grid" style="margin-top:12px">
    <div class="field"><label>Contact type</label><select id="batchType"><option value="">Any</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Required tag</label><select id="batchTag"><option value="">Any</option>${tags.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
    <div class="field"><label>Channel</label><select id="batchChannel"><option>Text</option><option>Email</option></select></div>
    <div class="field"><label>Email subject</label><input id="batchSubject" value="A quick Holton Homes check-in"></div>
    <div class="field full"><label>Message template</label><textarea id="batchBody">Hi {{first_name}}, I wanted to personally check in and see what has changed with your real estate plans. — {{agent_name}}</textarea><small class="field-help">Available fields: {{first_name}}, {{last_name}}, {{full_name}}, {{property}}, {{agent_name}}, {{agent_email}}, {{agent_phone}}.</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-batch-queue">Create review queue</button>`)
}
function saveBatchQueue(){
  const type=document.getElementById("batchType").value,tag=document.getElementById("batchTag").value,channel=document.getElementById("batchChannel").value,subject=document.getElementById("batchSubject").value.trim(),body=document.getElementById("batchBody").value.trim();
  if(!body){alert("Write a message.");return}
  const contacts=db.contacts.filter(c=>(!type||c.type===type)&&(!tag||c.tags.some(t=>t.toLowerCase()===tag.toLowerCase())));
  let count=0;contacts.forEach(c=>{if(channel==="Text"&&!hasPhone(c))return;if(channel==="Email"&&!hasEmail(c))return;queueAutomationMessage(c,channel,"Personal batch follow-up",body,subject,"Batch",`${TODAY()}:${type}:${tag}:${channel}`,TODAY());count++});
  save(false);closeModal();state.automationTab="queue";renderAutomations();toast("Batch queue created",`${count} personalized drafts need review`)
}
function queueItemModal(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  modal(`Review ${item.channel} for ${fullName(c)}`,`<div class="form-grid">
    <div class="field"><label>Person</label><input value="${esc(fullName(c))}" disabled></div>
    <div class="field"><label>Destination</label><input value="${esc(item.channel==="Text"?c.phone:c.email)}" disabled></div>
    ${item.channel==="Email"?`<div class="field full"><label>Subject</label><input id="queueSubject" value="${esc(item.subject||"")}"></div>`:""}
    <div class="field full"><label>Message</label><textarea id="queueBody">${esc(item.body)}</textarea></div>
    <div class="field full"><div class="warning">Launching opens your device's ${item.channel.toLowerCase()} app. Mark it sent only after you actually send it.</div></div>
  </div>`,`<button class="ghost-btn" data-action="skip-queue-item" data-id="${id}">Skip</button><button class="ghost-btn" data-action="launch-queue-item" data-id="${id}">Launch ${item.channel}</button><button class="primary-btn" data-action="mark-queue-sent" data-id="${id}">Mark sent</button>`)
}
function updateQueueDraftFromModal(item){
  const body=document.getElementById("queueBody");if(body)item.body=body.value;
  const subject=document.getElementById("queueSubject");if(subject)item.subject=subject.value
}
function launchQueueItem(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  updateQueueDraftFromModal(item);save(false);
  if(item.channel==="Text"&&hasPhone(c))location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(item.body)}`;
  if(item.channel==="Email"&&hasEmail(c))location.href=`mailto:${c.email}?subject=${encodeURIComponent(item.subject||"Holton Homes")}&body=${encodeURIComponent(item.body)}`
}
function markQueueSent(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  updateQueueDraftFromModal(item);item.status="Sent";item.sentAt=NOW();
  db.communications.unshift({id:uid(),contactId:c.id,channel:item.channel,direction:"outbound",outcome:"Sent from approval queue",body:item.body,date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();c.followUp=addDays(TODAY(),3);
  db.tasks.filter(t=>t.sourceKey===`queue:${item.id}`&&t.status!=="Done").forEach(t=>{t.status="Done";t.completedAt=TODAY()});
  automationLog({kind:"Approval Queue",name:item.title,contactId:c.id,status:"Completed",detail:`${item.channel} marked sent.`,sourceId:item.id});
  save();closeModal();renderAutomations();toast("Message logged",`${item.channel} to ${fullName(c)}`)
}
function skipQueueItem(id){
  const item=db.automationQueue.find(q=>q.id===id);if(!item)return;
  item.status="Skipped";item.skipReason="Skipped by user";db.tasks.filter(t=>t.sourceKey===`queue:${item.id}`&&t.status!=="Done").forEach(t=>{t.status="Done";t.completedAt=TODAY()});
  automationLog({kind:"Approval Queue",name:item.title,contactId:item.contactId,status:"Skipped",detail:"Skipped during human review.",sourceId:item.id});
  save(false);closeModal();renderAutomations();toast("Draft skipped",item.title)
}

function pipNotices(){
  const items=[];const hot=dueContacts().filter(c=>c.type==="Seller"&&c.heat==="Hot")[0];if(hot)items.push({title:`Call ${fullName(hot)}`,detail:"Hot seller follow-up is due.",route:`#/contact/${hot.id}`});
  const unread=db.communications.filter(x=>x.unread).length;if(unread)items.push({title:`Clear ${unread} unread conversation${unread===1?"":"s"}`,detail:"Protect response time and inbox zero.",route:"#/inbox"});
  const cleanup=db.contacts.filter(c=>isOpen(c)&&(!c.followUp||c.timeframe==="Unknown")).length;if(cleanup)items.push({title:`Clean up ${cleanup} relationship record${cleanup===1?"":"s"}`,detail:"Every open lead needs timing and a next step.",route:"#/people"});
  const high=behaviorAlerts()[0];if(high)items.push({title:`High intent: ${fullName(high.c)}`,detail:`${high.b.type}${high.b.property?` at ${high.b.property}`:""}.`,route:`#/contact/${high.c.id}`});
  if(!items.length)items.push({title:"Create one seller conversation",detail:"The system is clean. Add opportunity.",route:"#/people"});
  return items.slice(0,4)
}
function renderPip(){
  const list=pipNotices(),focus=list[0];document.getElementById("pipFocus").innerHTML=`<strong>${esc(focus.title)}</strong><p>${esc(focus.detail)}</p><a class="primary-btn compact" style="display:inline-block;margin-top:8px" href="${focus.route}" data-action="close-pip">Do it now</a>`;
  document.getElementById("pipNotices").innerHTML=list.slice(1).map(x=>`<div class="pip-notice"><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><a href="${x.route}" data-action="close-pip" style="font-size:8px;color:var(--pink-dark);font-weight:900">Open →</a></div>`).join("")
}
function openPip(){document.getElementById("pipDrawer").classList.add("open");document.getElementById("drawerBackdrop").classList.add("open");document.getElementById("pipDrawer").setAttribute("aria-hidden","false");renderPip()}
function closePip(){document.getElementById("pipDrawer").classList.remove("open");document.getElementById("drawerBackdrop").classList.remove("open");document.getElementById("pipDrawer").setAttribute("aria-hidden","true")}
function askPip(){
  const q=document.getElementById("pipAskInput").value.toLowerCase(),answer=document.getElementById("pipAnswer");let text=bestNext().title+". "+bestNext().detail;
  if(q.includes("seller"))text=dueContacts().filter(c=>c.type==="Seller").length?`You have ${dueContacts().filter(c=>c.type==="Seller").length} seller follow-ups due. Work hot sellers first.`:"No seller follow-up is due. Create a homeowner conversation.";
  else if(q.includes("buyer"))text=`You have ${db.contacts.filter(c=>c.type==="Buyer"&&isOpen(c)).length} open buyer relationships. Prioritize consultation, financing, and next steps.`;
  else if(q.includes("course")||q.includes("license"))text="Stop polishing the CRM and finish the next licensing lesson. The license unlocks the business.";
  else if(q.includes("call"))text=`Your call queue has ${callQueue().length} people. Start with sellers, then highest lead score.`;
  answer.textContent=text;answer.classList.add("open")
}

function toast(title,text){const el=document.getElementById("toast");document.getElementById("toastTitle").textContent=title;document.getElementById("toastText").textContent=text;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2400)}
function download(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
function exportCsv(){
  const rows=[["First Name","Last Name","Phone","Email","Contact Address","Contact Street","Contact Unit","Contact City","Contact State","Contact ZIP","Contact County","Contact Address Type","Synced to Primary Property","Type","Stage","Heat","Timeframe","Next Follow-Up","Last Communication","Source","Estimated from open opportunities GCI","Primary Property","Property City","Property State","Property ZIP","Property County","Property Type","Beds","Baths","Square Feet","Acres","Estimated Value","Mortgage Balance","Estimated Equity","Motivation","Tags","Notes"],
    ...db.contacts.map(c=>{const p=primaryProperty(c),a=contactAddressObject(c);return [c.firstName,c.lastName,c.phone,c.email,formattedAddress(a),a.street,a.unit,a.city,a.state,a.zip,a.county,a.type,a.sameAsPrimaryProperty?"Yes":"No",c.type,c.stage,c.heat,c.timeframe,c.followUp,c.lastCommunication,c.source,c.gci,propertyAddress(p)||c.property,p?.city||"",p?.state||"",p?.zip||"",p?.county||"",p?.propertyType||"",p?.beds||"",p?.baths||"",p?.sqft||"",p?.acres||"",p?.estimatedValue||"",p?.mortgageBalance||"",p?.estimatedValue?propertyEquity(p):"",p?.motivation||c.sellerDetails?.motivation||"",c.tags.join("; "),c.notes]})];
  download(`holton-homes-people-${TODAY()}.csv`,"text/csv",rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n"))
}
function seedDemo(){
  if(db.contacts.length&&!confirm("Add sample records to your current CRM?"))return;
  const seller={id:uid(),firstName:"Ashley",lastName:"Bennett",name:"Ashley Bennett",phone:"513-555-0134",email:"ashley@example.com",type:"Seller",stage:"Listing Appointment",heat:"Hot",timeframe:"Now — 0–3 months",followUp:TODAY(),lastCommunication:addDays(TODAY(),-2),source:"Referral",gci:16200,property:"Williamsburg, OH",tags:["pricing","seller"],notes:"Inherited the home and wants a clean timeline.",createdAt:addDays(TODAY(),-12),updatedAt:TODAY(),household:[],preferences:{},alertSettings:{propertyAlert:false,marketSnapshot:true,criteria:"Williamsburg competing listings",frequency:"Weekly",lastSent:""},behaviors:[{id:uid(),type:"Home Valuation",date:addDays(TODAY(),-1),property:"Williamsburg, OH"}]};
  const farm={id:uid(),firstName:"Michael",lastName:"Turner",name:"Michael Turner",phone:"937-555-0199",email:"michael@example.com",type:"Seller",stage:"Nurture",heat:"Warm",timeframe:"6–12 months",followUp:addDays(TODAY(),3),lastCommunication:addDays(TODAY(),-9),source:"Farm / Homestead Brand",gci:24000,property:"32-acre farm near Hillsboro",tags:["farm","downsizing"],notes:"Needs a plan before making a move.",createdAt:addDays(TODAY(),-30),updatedAt:TODAY(),household:[],preferences:{},alertSettings:{propertyAlert:false,marketSnapshot:true,criteria:"Farm and acreage comps",frequency:"Monthly",lastSent:""},behaviors:[]};
  const buyer={id:uid(),firstName:"Jordan",lastName:"Reed",name:"Jordan Reed",phone:"513-555-0177",email:"jordan@example.com",type:"Buyer",stage:"Pre-Approved",heat:"Warm",timeframe:"3–6 months",followUp:addDays(TODAY(),-1),lastCommunication:addDays(TODAY(),-5),source:"Social Media",gci:9200,property:"Lebanon / eastern Cincinnati",tags:["monthly-payment"],notes:"Wants payment under $2,100.",createdAt:addDays(TODAY(),-18),updatedAt:TODAY(),household:[],preferences:{areas:"Lebanon",minPrice:"250000",maxPrice:"330000",beds:"3",baths:"2"},alertSettings:{propertyAlert:true,marketSnapshot:false,criteria:"Lebanon; $250k–$330k; 3+ beds",frequency:"Daily",lastSent:""},behaviors:[{id:uid(),type:"Saved Property",date:TODAY(),property:"123 Sample Street"},{id:uid(),type:"Repeated Property View",date:TODAY(),property:"123 Sample Street"}]};
  db.contacts.unshift(seller,farm,buyer);db.tasks.unshift({id:uid(),contactId:seller.id,title:"Prepare listing consultation pricing",type:"Appointment",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()},{id:uid(),contactId:buyer.id,title:"Buyer financing follow-up",type:"Call",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});db.communications.unshift({id:uid(),contactId:seller.id,channel:"Call",direction:"outbound",outcome:"Appointment Set",body:"Booked listing consultation.",date:`${addDays(TODAY(),-2)}T14:00:00`,unread:false,threadStatus:"open",createdAt:NOW()},{id:uid(),contactId:buyer.id,channel:"Text",direction:"inbound",outcome:"Replied",body:"Can we look at the one on Sample Street?",date:NOW(),unread:true,threadStatus:"open",createdAt:NOW()});save();toast("Sample data added","Explore the complete workflow.");route()
}

document.addEventListener("click",event=>{
  const directNameLink=event.target.closest("a.person-name-link");
  if(directNameLink){
    const actionNode=directNameLink.closest("[data-action]");
    if(actionNode&&actionNode!==directNameLink)event.stopPropagation();
  }
  const el=event.target.closest("[data-action]");if(!el)return;
  const action=el.dataset.action,id=el.dataset.id,channel=el.dataset.channel;
  if(action==="cloud-sign-in")cloudSignIn();
  if(action==="cloud-sign-up")cloudSignUp();
  if(action==="cloud-reset-password")cloudResetPassword();
  if(action==="cloud-sign-out")cloudSignOut();
  if(action==="cloud-open-login")showAuthScreen();
  if(action==="cloud-sync-now")pushCloudState({force:true}).then(ok=>ok&&toast("Cloud synced",`${db.contacts.length} contacts saved.`));
  if(action==="cloud-pull-now")pullCloudState({force:true,announce:true});
  if(action==="cloud-use-remote"){if(pendingCloudRow){applyCloudRow(pendingCloudRow,{announce:true});pendingCloudRow=null;closeModal()}}
  if(action==="cloud-use-local"){pendingCloudRow=null;cloudReady=true;closeModal();pushCloudState({force:true}).then(()=>toast("Device copy uploaded","This device is now the cloud copy."))}
  if(action==="cloud-merge"){if(pendingCloudRow){db=mergeStates(db,pendingCloudRow.state);pendingCloudRow=null;cloudReady=true;closeModal();save();toast("CRM copies merged",`${db.contacts.length} contacts are now in the combined database.`)}}
  if(action==="work-primary")launchWorkItem(id);
  if(action==="work-launch")launchWorkItem(id,channel);
  if(action==="work-snooze")workSnoozeModal(id);
  if(action==="save-work-snooze")saveWorkSnooze(id,el.dataset.days);
  if(action==="queue-call")launchQueueCall(id,el.dataset.task||"");
  if(action==="call-next")moveCallQueue(1);
  if(action==="call-prev")moveCallQueue(-1);
  if(action==="review-duplicate")duplicateReviewModal(id);
  if(action==="merge-duplicate")mergeContacts(id,el.dataset.merge||"");
  if(action==="trash-contact")trashContact(id);
  if(action==="restore-deleted")restoreDeleted(id);
  if(action==="permanent-delete")permanentlyDelete(id);
  if(action==="apply-message-template")applyMessageTemplate(el.dataset.contact||"");
  if(action==="open-template")templateModal(id||"");
  if(action==="save-template")saveTemplate();
  if(action==="delete-template")deleteTemplate(id);
  if(action==="fill-contact-address-from-property")fillContactAddressFromPrimaryProperty();
  if(action==="copy-contact-address"){const c=contact(id);if(c&&contactAddressDisplay(c))copyTextValue(contactAddressDisplay(c),"Address copied")}
  if(action==="show-script")openConversationMode(id,el.dataset.context||"profile",el.dataset.task||"",el.dataset.work||"");
  if(action==="script-call")launchScriptCall(id);
  if(action==="copy-phone"){const c=contact(id);if(c)copyTextValue(c.phone,"Phone number copied")}
  if(action==="copy-script-section")copyScriptSection(el.dataset.section||"");
  if(action==="toggle-script-question")el.classList.toggle("asked");
  if(action==="show-script-objection")showScriptObjection(el.dataset.index||0);
  if(action==="copy-objection"){
    const c=contact(document.getElementById("scriptContactId")?.value),s=db.callScripts.find(x=>x.id===document.getElementById("scriptSelect")?.value),o=s?.objections?.[Number(el.dataset.index||0)];
    if(c&&o)copyTextValue(fillScriptText(o.response,c),"Objection response copied")
  }
  if(action==="script-voicemail-text")launchVoicemailText(id);
  if(action==="set-script-outcome")setScriptOutcome(el.dataset.outcome||"Connected");
  if(action==="save-script-outcome")saveConversationOutcome();
  if(action==="script-skip-next")skipConversationToNext();
  if(action==="open-call-script")callScriptEditorModal(id||"");
  if(action==="save-call-script")saveCallScript();
  if(action==="delete-call-script")deleteCallScript(id);
  if(action==="reset-call-scripts")resetCallScripts();
  if(action==="change-tx-next")transactionNextStepModal(id);
  if(action==="choose-tx-next"){setTransactionNextStep(id,el.dataset.step||"");closeModal()}
  if(action==="clear-tx-next"){clearTransactionNextStep(id);closeModal()}
  if(action==="make-tx-next")setTransactionNextStep(id,el.dataset.step||"");
  if(action==="complete-tx-next")completeTransactionNext(id);
  if(action==="move-tx-next-date")moveTransactionNextDate(id,el.dataset.days||1);
  if(action==="open-transaction-resource")transactionResourceModal(id||"");
  if(action==="save-transaction-resource")saveTransactionResource();
  if(action==="delete-transaction-resource")deleteTransactionResource(id);
  if(action==="open-transaction")transactionModal(id||"",el.dataset.contact||"");
  if(action==="save-transaction")saveTransaction();
  if(action==="transaction-filter"){state.transactionFilter=id;renderTransactions()}
  if(action==="quick-complete-tx-step")quickCompleteTransactionStep(id,el.dataset.step||"");
  if(action==="edit-tx-step")transactionStepModal(id,el.dataset.step||"");
  if(action==="add-tx-step")transactionStepModal(id);
  if(action==="save-tx-step")saveTransactionStep();
  if(action==="delete-tx-step"){const tx=transaction(id);if(tx&&confirm("Delete this custom transaction step?")){tx.checklist=tx.checklist.filter(step=>step.id!==el.dataset.step);save();closeModal();renderTransaction(id)}}
  if(action==="transaction-status-menu")transactionStatusModal(id);
  if(action==="set-transaction-status")setTransactionStatus(id,el.dataset.status||"Under Contract");
  if(action==="terminate-transaction")terminateTransaction(id);
  if(action==="copy-transaction-update"){const tx=transaction(id);if(tx)copyTextValue(transactionUpdateText(tx),"Client update copied")}
  if(action==="text-transaction-update"){const tx=transaction(id),c=contact(tx?.contactId);if(tx&&c&&hasPhone(c))location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(transactionUpdateText(tx))}`}
  if(action==="print-transaction")window.print();
  if(action==="quick-launch")quickLaunch(channel,id);
  if(action==="save-pending-touch")savePendingTouchLog(id,channel);
  if(action==="dismiss-pending-touch"){clearPendingTouch();closeModal()}
  if(action==="open-cleanup")cleanupModal(id);
  if(action==="save-cleanup")saveCleanup(id);
  if(action==="snooze-cleanup")snoozeCleanup(id);
  if(action==="open-contact")openContactModal(id||"");
  if(action==="open-contact-type"){
    openContactModal("");
    const type=document.getElementById("contactType");
    if(type){
      type.value=id;
      type.dispatchEvent(new Event("change",{bubbles:true}))
    }
  }
  if(action==="save-contact")saveContact();
  if(action==="composer-channel"){document.getElementById("profileComposerChannel").value=channel;document.querySelectorAll(".composer-tab").forEach(b=>b.classList.toggle("active",b.dataset.channel===channel));const launch=document.querySelector('[data-action="launch-inline-channel"]');if(launch)launch.textContent=["Call","Text","Email"].includes(channel)?`Launch ${channel}`:"No launch needed"}
  if(action==="launch-inline-channel"){const ch=document.getElementById("profileComposerChannel").value;if(["Call","Text","Email"].includes(ch))launchChannel(ch,id)}
  if(action==="save-inline-activity")saveInlineActivity(id);
  if(action==="complete-next-action")completeNextAction(id,channel,el.dataset.task||"");
  if(action==="reschedule-contact")rescheduleModal(id);
  if(action==="save-reschedule")saveReschedule(id);
  if(action==="complete-task-button"){const t=task(id);if(t){t.status="Done";t.completedAt=TODAY();save();route();toast("Task completed",t.title)}}
  if(action==="close-modal")closeModal();
  if(action==="communicate"||action==="open-communication")communicationModal(id||"",channel||"Note");
  if(action==="switch-channel")communicationModal(el.dataset.contact||"",id);
  if(action==="save-communication")saveCommunication();
  if(action==="launch-channel")launchChannel(channel,id);
  if(action==="open-profile")location.hash=`#/contact/${id}`;
  if(action==="name-link")return;
  if(action==="open-property")propertyModal(id,el.dataset.property||"");
  if(action==="save-property")saveProperty();
  if(action==="delete-property")deleteProperty(id,el.dataset.property||"");
  if(action==="make-primary-property")makePrimaryProperty(id,el.dataset.property||"");
  if(action==="open-household")householdModal(id,el.dataset.member||"");
  if(action==="save-household")saveHousehold();
  if(action==="delete-household")deleteHousehold(id,el.dataset.member||"");
  if(action==="promote-household")promoteHouseholdToContact(id,el.dataset.member||"");
  if(action==="household-communicate")householdCommunicate(el.dataset.contact||"",el.dataset.member||"",channel||"Call");
  if(action==="open-tag")openTagModal(id);
  if(action==="choose-tag"){const input=document.getElementById("newTagValue");if(input)input.value=el.dataset.tag||""}
  if(action==="save-tag"){const input=document.getElementById("newTagValue");if(addTagToContact(id,input?.value||"")){closeModal();toast("Tag added",normalizeTag(input.value));route()}}
  if(action==="remove-tag"){event.preventDefault();event.stopPropagation();removeTag(id,el.dataset.tag||"")}
  if(action==="filter-tag"){state.peopleQuery=el.dataset.tag||"";state.smartList="all";location.hash="#/people";setTimeout(renderPeople,0)}
  if(action==="smart-list"){state.smartList=id;renderPeople()}
  if(action==="clear-people"){state.peopleQuery=state.peopleType=state.peopleStage=state.peopleHeat="";renderPeople()}
  if(action==="inbox-folder"){state.inboxFolder=id;state.activeThread=null;renderInbox()}
  if(action==="open-thread"){state.activeThread=id;renderInbox()}
  if(action==="toggle-thread"){const ms=db.communications.filter(m=>m.contactId===id);const close=ms.at(-1)?.threadStatus!=="closed";ms.forEach(m=>m.threadStatus=close?"closed":"open");save();renderInbox()}
  if(action==="send-inbox-reply"){const body=document.getElementById("inboxReply").value.trim(),ch=document.getElementById("inboxChannel").value;if(body){communicationModal(id,ch);setTimeout(()=>{const b=document.getElementById("commBody");if(b)b.value=body},0)}}
  if(action==="inbox-zero"){db.communications.forEach(m=>m.unread=false);save();renderInbox()}
  if(action==="open-task")openTaskModal(id||"");
  if(action==="save-task")saveTask();
  if(action==="complete-task"){const t=task(id);if(t){t.status=el.checked?"Done":"Open";t.completedAt=el.checked?TODAY():"";save();route()}}
  if(action==="delete-task"){db.tasks=db.tasks.filter(t=>t.id!==id);save();route()}
  if(action==="task-filter"){state.taskFilter=id;renderTasks()}
  if(action==="open-behavior")behaviorModal(id);
  if(action==="save-behavior")saveBehavior();
  if(action==="open-alerts")alertsModal(id);
  if(action==="save-alerts")saveAlerts(id);
  if(action==="automation-tab"){state.automationTab=id;renderAutomations()}
  if(action==="run-engine"){processAutomationEngine({manual:true});toast("Automation check complete","Rules, plans, and due steps were evaluated.")}
  if(action==="open-rule-builder")ruleBuilderModal(id||"",false);
  if(action==="save-rule-builder")saveRuleBuilder();
  if(action==="toggle-rule"){const rule=db.automationRules.find(r=>r.id===id);if(rule){rule.active=!rule.active;save(false);renderAutomations()}}
  if(action==="preview-rule")previewRuleModal(id);
  if(action==="run-rule")runRuleNow(id);
  if(action==="duplicate-rule")ruleBuilderModal(id,true);
  if(action==="open-plan-builder")planBuilderModal(id||"",false);
  if(action==="save-plan-builder")savePlanBuilder();
  if(action==="duplicate-plan")planBuilderModal(id,true);
  if(action==="build-batch-queue")batchQueueModal();
  if(action==="save-batch-queue")saveBatchQueue();
  if(action==="process-next-queue"){const next=db.automationQueue.find(q=>q.status==="Needs Review");if(next)queueItemModal(next.id);else toast("Queue clear","No messages need review.")}
  if(action==="open-queue-item")queueItemModal(id);
  if(action==="launch-queue-item")launchQueueItem(id);
  if(action==="mark-queue-sent")markQueueSent(id);
  if(action==="skip-queue-item")skipQueueItem(id);
  if(action==="clear-automation-logs"&&confirm("Clear the automation audit log? Contacts and plan runs will remain.")){db.automationLogs=[];save(false);renderAutomations()}
  if(action==="apply-plan")planModal(id||"",el.dataset.plan||"");
  if(action==="save-plan-run")savePlanRun();
  if(action==="toggle-plan-run"){const run=db.planRuns.find(r=>r.id===id);if(run){run.status=run.status==="Active"?"Paused by user":"Active";run.pauseReason=run.status==="Active"?"":"Paused by user";save();renderAutomations()}}
  if(action==="pipeline-type"){state.pipelineType=id;renderPipeline()}
  if(action==="select-call"){state.callIndex=Number(el.dataset.index||0);const q=callQueue();db.settings.callQueueResumeContactId=q[state.callIndex]?.c.id||"";save(false);renderCallQueue()}
  if(action==="create-call-tasks"){dueContacts().filter(hasPhone).forEach(c=>{if(!db.tasks.some(t=>t.contactId===c.id&&t.type==="Call"&&t.status!=="Done"))db.tasks.push({id:uid(),contactId:c.id,title:`Follow up with ${fullName(c)}`,type:"Call",due:c.followUp||TODAY(),status:"Open",priority:c.heat==="Hot"?"High":"Normal",planRunId:"",createdAt:TODAY()})});save();renderCallQueue();toast("Call queue updated","Due follow-ups were added.")}
  if(action==="open-note")communicationModal(id,"Note");
  if(action==="open-pip")openPip();
  if(action==="close-pip")closePip();
  if(action==="ask-pip")askPip();
  
  if(action==="save-settings"){db.settings.agentName=document.getElementById("settingAgentName").value.trim()||"Jacob";db.settings.agentEmail=document.getElementById("settingAgentEmail").value.trim();db.settings.agentPhone=document.getElementById("settingAgentPhone").value.trim();save();toast("Settings saved","Agent profile updated.")}
  if(action==="save-goals"){
    db.settings.annualGciTarget=Number(document.getElementById("settingGciTarget").value||100000);
    db.settings.sellerShareGoal=Number(document.getElementById("settingSellerShare").value||60);
    db.settings.dailyConversationTarget=Number(document.getElementById("settingConversationTarget").value||5);
    db.settings.coreMarkets=document.getElementById("settingCoreMarkets").value.trim();
    save();toast("Goals saved","Your dashboard now reflects how Holton Homes should operate.")
  }
  if(action==="export-json"){db.settings.lastManualBackupAt=TODAY();save();download(`holton-homes-backup-${TODAY()}.json`,"application/json",JSON.stringify(db,null,2));toast("Backup downloaded","Keep this file in Google Drive, iCloud, or Dropbox.")}
  if(action==="export-csv")exportCsv();
  if(action==="import-json"){const f=document.getElementById("importFile").files[0];if(!f){alert("Choose a JSON backup.");return}const reader=new FileReader();reader.onload=()=>{try{db=normalize(JSON.parse(reader.result));save();toast("Backup imported","CRM data restored.");route()}catch{alert("That backup could not be read.")}};reader.readAsText(f)}
  if(action==="request-persistent-storage"){
    if(navigator.storage?.persist){
      navigator.storage.persist().then(granted=>{
        const status=document.getElementById("storageProtectionStatus");
        if(status)status.textContent=granted?"Protection enabled. The browser is less likely to remove CRM data automatically. Manual deletion can still erase it.":"Protection was not granted. Weekly downloaded backups remain essential.";
        toast(granted?"Browser protection enabled":"Protection unavailable",granted?"Automatic browser cleanup is less likely to remove this CRM.":"Keep downloading backups.")
      })
    }else toast("Not supported","This browser does not support persistent-storage requests.")
  }
  if(action==="clear-data"&&confirm("Clear the CRM cache on this device? Your cloud database will not be deleted.")){
    localStorage.removeItem(STORAGE_KEY);
    try{indexedDB.deleteDatabase("HoltonHomesCRMBackup")}catch(error){}
    db=normalize({});
    persistLocalSnapshot();
    if(cloudUser)pullCloudState({force:true,announce:true});
    else route();
    toast("Device cache cleared",cloudUser?"Your cloud copy is downloading again.":"Sign in to restore cloud data.")
  }
});
document.addEventListener("change",event=>{
  const txStepControl=event.target.closest('[data-action="tx-step-status"],[data-action="tx-step-due"],[data-action="tx-step-owner"]');
  if(txStepControl){
    const field=txStepControl.dataset.action==="tx-step-status"?"status":txStepControl.dataset.action==="tx-step-due"?"due":"owner";
    updateTransactionStep(txStepControl.dataset.id,txStepControl.dataset.step,field,txStepControl.value);return
  }
  if(event.target.id==="transactionContact"){
    const c=contact(event.target.value),side=document.getElementById("transactionSide"),propertySelect=document.getElementById("transactionProperty");
    if(c&&side)side.value=c.type;
    if(c&&propertySelect)propertySelect.innerHTML=`<option value="">Use address below</option>${propertiesForContact(c.id).map(p=>`<option value="${p.id}">${esc(propertyAddress(p)||p.role)}</option>`).join("")}`;
    return
  }
  if(event.target.id==="transactionProperty"){
    const p=db.properties.find(item=>item.id===event.target.value);
    if(p){[["transactionStreet","street"],["transactionUnit","unit"],["transactionCity","city"],["transactionState","state"],["transactionZip","zip"],["transactionCounty","county"]].forEach(([id,key])=>{const field=document.getElementById(id);if(field)field.value=p[key]||""})}
    return
  }
  if(event.target.id==="scriptSelect"){changeConversationScript();return}
  if(event.target.id==="scriptOutcome"){
    document.getElementById("scriptAppointmentField")?.classList.toggle("show",event.target.value==="Appointment Set");
    saveScriptDraftFromFields();return
  }
  if(["scriptFollowUp","scriptAppointmentDate"].includes(event.target.id)){saveScriptDraftFromFields();return}
  const inline=event.target.closest('[data-action="inline-contact-field"]');
  if(inline){const c=contact(inline.dataset.id);if(c){const oldValue=c[inline.dataset.field];c[inline.dataset.field]=inline.value;c.updatedAt=TODAY();if(inline.dataset.field==="stage")applyStageWorkflow(c,oldValue,inline.value);save();renderContact(c.id);toast("Contact updated",`${inline.dataset.field} → ${inline.value}`)}return}
  if(event.target.id==="contactType"){const type=event.target.value,stage=document.getElementById("contactStage");stage.innerHTML=(type==="Buyer"?buyerStages:sellerStages).map(x=>`<option>${x}</option>`).join("");const holder=document.getElementById("contactSpecificFields");if(holder)holder.innerHTML=contactSpecificForm({},type)}
  if(event.target.id==="peopleType"){state.peopleType=event.target.value;renderPeople()}
  if(event.target.id==="peopleStage"){state.peopleStage=event.target.value;renderPeople()}
  if(event.target.id==="peopleHeat"){state.peopleHeat=event.target.value;renderPeople()}
});
document.addEventListener("input",event=>{
  if(event.target.id==="scriptNotes"){saveScriptDraftFromFields();return}
  if(event.target.id==="peopleSearch"){state.peopleQuery=event.target.value;renderPeople()}
  if(event.target.id==="globalSearch"){
    const q=event.target.value.toLowerCase().trim(),box=document.getElementById("globalSearchResults");
    if(!q){box.classList.remove("open");box.innerHTML="";return}
    const hits=db.contacts.filter(c=>[fullName(c),c.phone,c.email,contactAddressDisplay(c),c.address?.county,c.property,propertyDisplay(c),...propertiesForContact(c.id).map(propertyAddress),...c.tags].join(" ").toLowerCase().includes(q)).slice(0,8);
    box.innerHTML=hits.length?hits.map(c=>`<a class="search-hit" href="#/contact/${c.id}"><div><strong class="person-name-link">${esc(fullName(c))}</strong><small>${esc(c.stage)} • ${esc(c.phone||c.email||"No contact info")}</small></div><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></a>`).join(""):`<div class="empty">No matches.</div>`;box.classList.add("open")
  }
});
document.addEventListener("keydown",event=>{
  if((event.key==="s"||event.key==="S")&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){
    const match=(location.hash||"").match(/^#\/contact\/([^/]+)/);
    if(match){event.preventDefault();openConversationMode(match[1],"profile");return}
    if(state.route==="call-queue"){const q=callQueue(),active=q[activeCallQueueIndex(q)];if(active){event.preventDefault();openConversationMode(active.c.id,"call-queue",active.task?.id||"");return}}
  }
  if(event.key==="Enter"&&["cloudAuthEmail","cloudAuthPassword"].includes(event.target.id)){
    event.preventDefault();cloudSignIn();return
  }
  if(event.key==="Enter"&&event.target.id==="newTagValue"){
    event.preventDefault();
    const saveButton=document.querySelector('[data-action="save-tag"]');
    if(saveButton)saveButton.click()
  }
});
document.addEventListener("dragstart",event=>{const card=event.target.closest(".deal-card");if(card)event.dataTransfer.setData("text/plain",card.dataset.contact)});
document.addEventListener("dragover",event=>{const col=event.target.closest(".kanban-column");if(col){event.preventDefault();col.classList.add("dragover")}});
document.addEventListener("dragleave",event=>event.target.closest(".kanban-column")?.classList.remove("dragover"));
document.addEventListener("drop",event=>{const col=event.target.closest(".kanban-column");if(!col)return;event.preventDefault();col.classList.remove("dragover");const c=contact(event.dataTransfer.getData("text/plain"));if(c){const oldStage=c.stage;c.stage=col.dataset.stage;c.updatedAt=TODAY();applyStageWorkflow(c,oldStage,c.stage);save();renderPipeline();toast("Stage updated",`${fullName(c)} → ${c.stage}`)}})
document.getElementById("globalAddPerson")?.addEventListener("click",event=>{
  event.preventDefault();
  event.stopPropagation();
  openContactModal("");
});

window.addEventListener("focus",()=>{
  setTimeout(showPendingTouchPrompt,250);
  if(cloudReady)setTimeout(()=>pullCloudState({announce:false}),700)
});
window.addEventListener("online",()=>{if(cloudUser){setCloudStatus("Syncing…","Connection restored");scheduleCloudSave(100)}});
window.addEventListener("offline",()=>setCloudStatus("Offline — saved locally","Changes will upload when your connection returns"));
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible")setTimeout(showPendingTouchPrompt,250)
});
document.getElementById("drawerBackdrop").addEventListener("click",closePip);
document.getElementById("modalBackdrop").addEventListener("click",event=>{if(event.target.id==="modalBackdrop")closeModal()});
window.addEventListener("hashchange",route);
db=loadDatabase();renderPip();route();restoreFromIndexedDbIfNeeded();setTimeout(()=>processAutomationEngine(),250);initCloud();
})();