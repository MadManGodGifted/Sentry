# SENTRY Design & Product Specification

Version 1.0

## Vision

Sentry is not a chatbot, dashboard, or website.

Sentry is an operating environment for AI-assisted research, engineering, intelligence gathering, and knowledge work. It should feel like professional software used inside a mission control center rather than software built for consumers.

Users are operators, not customers. Every interaction should communicate precision, reliability, and control.

## Core Inspirations

The interface philosophy is inspired by:

- Evangelion NERV HQ
- MAGI System
- NASA Mission Control
- Alien Isolation computer systems
- Industrial SCADA software
- Military command consoles
- 1980-1990 UNIX workstations
- CRT engineering terminals
- Aerospace navigation computers

These are inspirations for philosophy and atmosphere only. Never directly copy any interface.

## Overall Feeling

The application should feel:

- Operational
- Industrial
- Mechanical
- Engineered
- Technical
- Purposeful
- Restrained
- Minimal
- Mission critical
- Timeless

Every pixel should appear to exist for a reason.

## The User

The person using Sentry is an operator, not a casual user. The interface should never explain itself like consumer software. It assumes competence.

Panels report status. Modules communicate state.

The interface never asks "Let's get started."

It reports:

- NO ACTIVE SESSION
- MODULE OFFLINE
- WAITING FOR INPUT
- READY

## Design Philosophy

The interface should resemble software controlling real systems.

Never a marketing website. Never a landing page. Never a SaaS dashboard.

Every component should feel permanently mounted inside the operating system. Nothing floats. Nothing feels decorative. Whitespace is functional. Everything follows a strict grid.

## Visual Language

Everything feels physically manufactured:

- Painted steel
- Brushed aluminium
- Industrial plastic
- CRT glass
- Military hardware

Nothing should resemble floating web cards or modern design trends.

## Things Sentry Never Does

- Hero sections
- Giant typography
- Glassmorphism
- Floating cards
- Large rounded buttons
- Decorative gradients
- Neon cyberpunk
- Oversized icons
- Marketing illustrations
- Empty decorative space
- Consumer SaaS components
- Apple style
- Material Design
- Vibrant colors

## Color System

Sentry uses restrained multi-color scientific signal language. Never rely on a single amber accent.

Base colors:

- Deep black: `#060606`
- Dark panel: `#0B0B0D`
- Warm gray: `#232323`
- CRT white: `#E9E4D8`

Signal colors:

- Radar red: `#E5483B` for orbital paths and watch states
- Warning orange: `#F06A2A` for alerts
- Amber: `#C58B29` for interface chrome
- Terminal green: `#55D86A` for live systems
- CRT cyan: `#53D6E8` for telemetry
- Satellite blue: `#4E83FF` for satellite information
- Magenta: `#C84FFF` used rarely for graph or anomaly markers

These colors should never dominate. They communicate different information classes and should remain slightly restrained by dark panels, small type, thin lines, and subtle phosphor glow.

## Surface Texture

The interface should never appear perfectly digital. It should feel like hardware that has been continuously running for years.

Always include:

- Very subtle monochrome film grain
- CRT scanlines
- Slight phosphor glow
- Tiny brightness inconsistency
- Microscopic dust
- Very soft vignette
- Tiny scratches
- Subtle luminance noise

Noise should remain below 3%. Texture should be visible only when looking carefully.

## Aerospace Visualization Language

The shell must feel ready for NASA telemetry, asteroid tracking, satellite constellations, research graphs, knowledge maps, large network diagrams, timeline systems, and mission analytics.

The center workspace should be designed around dense scientific visualization rather than empty dashboard space. Prefer plotting grids, orbital trajectories, path overlays, node maps, telemetry stacks, coordinates, frame counters, signal strength, clock references, and machine identifiers.

The background grid should feel like plotting paper:

- Minor divisions use darker low-opacity lines
- Major divisions are brighter
- Coordinate readouts are always visible
- Labels and small technical annotations should reward close inspection

Bright data may emit a tiny phosphor glow. Never use heavy bloom, neon cyberpunk effects, or decorative color washes.

## Visual Aging

The interface is old, not broken.

Corners are faded. Borders have inconsistent brightness. Amber text blooms slightly. The grid has tiny imperfections. Panels have microscopic luminance variation. The interface feels manufactured between 1987-1998.

## Typography

- Primary: Space Grotesk
- Technical labels: IBM Plex Mono
- Metadata: JetBrains Mono

Never use huge typography. The largest text on screen should rarely exceed 48px. Technical labels should always dominate the hierarchy.

## Layout

Use a strict engineering grid. Every panel aligns perfectly. Panels use square corners, thin borders, and consistent spacing. Everything should appear modular.

No floating elements.

## Window

The product is a desktop application shell:

- Top command bar
- Left navigation rail
- Center workspace
- Right information modules
- Bottom status bar

Every page inherits this layout.

## Sidebar

Navigation uses icons only:

- 16-18px
- Thin outline style
- Monochrome
- Amber vertical indicator for selected item
- No colorful icons
- No filled icons

## Panels

Panels are square, mounted, and bordered with 1px lines. They use tiny engineering labels, panel IDs, and status indicators.

Panels should never appear empty. They should contain compact data immediately, such as:

- Satellite count
- Mission clock
- Queue state
- Memory state
- Signal strength
- Coordinates
- Frame IDs
- Node IDs

Allowed states include:

- OFFLINE
- ONLINE
- READY
- EMPTY
- WAITING
- IDLE
- UNKNOWN

## Buttons

Buttons are small, uppercase, square-cornered, and amber-outlined. Filled states appear only on hover.

Acceptable labels:

- EXECUTE
- OPEN
- SEARCH
- RUN

Never use labels like Continue, Start, Get Started, Next, or Launch.

## Inputs

Inputs use dark backgrounds, thin borders, monospaced cursors, square corners, and an engineering appearance.

## Terminal

Terminal surfaces are monospaced, restrained, and use a blinking cursor. Avoid decorative syntax highlighting. The terminal should feel like an actual workstation terminal.

## Status Lights

- Green: healthy
- Amber: busy
- Red: fault
- Gray: offline

Never animate status lights excessively.

## Motion

Animations should barely be noticeable:

- Blinking cursor
- Tiny LED pulse
- 150ms hover
- Very slow panel transitions

No scaling, bounce, or flashy effects.

## Iconography

Use technical outline icons with thin strokes. Icons are monochrome and industrial. No emoji or colorful glyphs.

## Workspace Philosophy

The interface is always active. It never waits for initialization. Modules report state.

Wrong:

- Initialize Workspace

Correct:

- MISSION TERMINAL
- STATUS
- NO ACTIVE SESSION
- WORKSPACE
- NOT LOADED

## Development Phases

### Phase 1

Shell, design system, navigation, panels, status bar, grid, animations. No AI functionality.

### Phase 1.5

Refine spacing, improve hierarchy, improve textures, perfect panel system, remove remaining landing page patterns.

### Phase 2

Workspace, dockable panels, tabs, resizable layout, command palette, workspace memory, terminal.

### Phase 3

AI, chat, streaming, history, composer, context, attachments.

### Phase 4

Research, sources, search, knowledge graph, timeline, notes.

### Phase 5

Projects, repositories, files, GitHub, tasks, persistence.

### Phase 6

Automation, agents, MCP, scheduling, tool orchestration, background jobs.

### Phase 7

Performance, accessibility, keyboard navigation, themes, final polish.

## Instructions For Every Future Generation

Never redesign Sentry. Never introduce modern dashboard patterns. Never invent new visual languages. Every future feature must inherit this specification exactly.

If a requested feature conflicts with this specification, preserve the specification.

Consistency is more important than novelty.

Sentry should feel like an operating system that has evolved over decades rather than an application designed in a single iteration.
