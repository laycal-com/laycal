---
title: "How to Measure Your Lead Response Time"
description: "A step-by-step way to work out how long new leads wait for your first call, using data you already have, and what to do with the number once you have it."
author: "Laycal Team"
category: "Lead Response"
publishedAt: "2026-10-11"
image: "/assets/blogs/lead-response-time.png"
featured: true
tags: ["Speed to Lead", "Lead Response Time", "Lead Follow-Up"]
readTime: "5 min read"
---

Most businesses have a rough idea of how fast they call new leads back. "Usually the same day" is a common answer. It is rarely based on anything, and it is usually kinder than the truth.

You can replace the guess with a real number in about an hour, using information you already have. This guide shows how.

## What you are measuring

Lead response time, also called speed to lead, is the gap between two moments:

1. **The lead asks to be contacted.** They submit your form, request a quote or ask for a callback.
2. **You make the first call attempt.** Not the first conversation, the first attempt. That is the part you control.

It is worth tracking a second number alongside it: the share of leads that never got a call at all. That one is often the bigger surprise.

## What you need

Two timestamps for each lead.

**When the lead came in.** Your form tool records this. So does your CRM, and so does the notification email that lands in your inbox when a form is submitted.

**When you first called.** Look in your phone system's call log, your CRM's activity history, or the call history on the mobile that was used. Search by the lead's phone number.

If you cannot find the second timestamp for a lead, that usually means the call never happened. Record it that way.

## The steps

1. **Pull the last 30 days of leads** into a spreadsheet: name, phone number, and the date and time they came in.
2. **Add the first call attempt** for each one, as a date and time. Leave it blank if there was none.
3. **Calculate the gap.** With the lead time in column B and the call time in column C, the formula `=C2-B2` gives the wait. Format that column as a duration.
4. **Take the median, not the average.** Use `=MEDIAN(D2:D200)`. One lead who waited two weeks will drag an average far away from what most leads experienced. The median is the wait of the lead in the middle of the list.
5. **Count the blanks.** Divide the number of leads with no call by the total. That is your never-called share.
6. **Split by when the lead arrived.** Tag each lead as working hours, evening or weekend, and look at the median for each group.

## An example

This is an illustration with made-up figures, to show the arithmetic. It is not a benchmark.

Say ten leads came in last week. Seven were called, after waits of 12 minutes, 40 minutes, 1 hour, 3 hours, 5 hours, 19 hours and 26 hours. Three were never called.

- The **median wait** of the seven that were called is 3 hours.
- The **average** is nearly 8 hours, because of the two overnight leads. The average makes a typical lead's wait look worse than it was; the median does not.
- The **never-called share** is three in ten.

The two long waits are both leads that arrived in the evening. That is the pattern step 6 is designed to expose.

## Reading your own numbers

There is no universal target worth quoting here. What matters is what the number means for your business, and three questions get you there.

- **Do your leads contact other businesses too?** If someone who asks you for a quote is also asking two competitors, your wait is being compared with theirs.
- **Where is the time going?** A long median during working hours points at workload or at nobody owning the inbox. A short one during the day with long waits out of hours points at coverage.
- **Who was never called, and why?** Look at those leads individually. They are often the ones that arrived at a busy moment and slid down the list.

## Ways to shorten it

- **Give new leads one owner per shift.** A shared inbox that everyone watches is an inbox nobody watches.
- **Send the notification to a phone, not just an inbox.** A text or a push alert gets seen sooner than an email.
- **Call before you email.** A reply by email feels like a response, but the lead is still waiting to talk to someone.
- **Measure again next month.** The number tends to improve simply because someone is looking at it.

If the gap comes from nobody being free to make the call, which is the usual cause out of hours, the first call can be made automatically. That is what Laycal does: an AI voice agent phones each new lead within a minute of the form being submitted, asks your qualifying questions and books the meeting. More on that under [speed to lead](/speed-to-lead).

Once you have your own figures, the [calculator on our homepage](/#roi) turns them into what the wait is costing you.
