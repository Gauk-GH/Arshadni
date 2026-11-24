# Arshadni

## Problem

At the end of each semester, students struggle to identify which courses
remain before graduation. They currently navigate a slow university
website and check courses one by one. They also need a clearer view of
how to plan the remaining courses and graduate on time.

## User

A 21-year-old second-year college student using an iPad or laptop at
home during course-registration periods. The intended audience is
students across universities and majors.

## Goal

Let a student quickly see which required courses remain, then understand
a possible route toward graduation.

## User stories

-   **MUST** --- As a student, I want to enter my completed courses and
    degree requirements so that I can identify the courses I still need.
-   **MUST** --- As a student, I want to see a clear list of my
    remaining required courses so that I can plan my next registration.
-   **MUST** --- As a student, I want to see a simple suggested order
    for taking the remaining courses so that I can plan toward
    graduation.

## MVP scope

The original scope is too large for one beginner working alone with an
AI coding agent for four days. In particular, supporting every
university and major, reading different transcript PDFs/images, and
calculating a reliable shortest graduation path is not realistic.

Build a narrow first version: - No login or account creation. - Students
manually enter completed courses and the required courses from their own
study plan. - Show the courses marked completed and the required courses
still remaining. - Provide a basic suggested order only when the student
supplies prerequisite information. Do not claim it is the mathematically
shortest path. - Keep the experience usable on an iPad and laptop.

PDF/image transcript reading and automatic course extraction are cut
from the four-day MVP. Manual entry is the only supported input method
for this version.

## Out of scope

-   Automatic support for every university's course catalog or study
    plan.
-   PDF/image transcript parsing.
-   Connecting to university systems or fetching transcripts.
-   Login, accounts, or cloud-saved student profiles.
-   Guaranteed shortest-path or graduation-date calculations.
-   Course availability, seat counts, registration, and enrollment.

## Key screens

1.  **Course input** --- Enter completed courses, required courses, and
    any known prerequisites.
2.  **Remaining courses** --- Review completed courses and the courses
    still required.
3.  **Graduation plan** --- View a basic suggested course order based on
    the prerequisite information provided.

## Data it remembers

-   Completed course names or codes.
-   Required course names or codes.
-   Prerequisite relationships entered by the student.
-   The current session's course information (without requiring an
    account).

## Open questions

-   What exact fields appear in the academic transcript?
-   How will students obtain an accurate list of required courses for
    their major?
-   Do universities use consistent course codes and prerequisite rules?
-   What limits should apply to courses taken per semester?

## Three riskiest assumptions

1.  Students can easily find and accurately enter their completed and
    required courses.
2.  Students will trust a plan based on information they enter
    themselves.
3.  A useful course order can be suggested without university-specific
    rules, course availability, and registration constraints.
