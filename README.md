# College Cricket Auction

Build a polished full-stack IPL College Auction web app for a live college auction event. This is an operator-controlled auction dashboard that will also be projected to an audience. Use React/TypeScript/Tailwind/shadcn as appropriate. Make it feel like a premium cricket auction broadcast UI: dark stadium-inspired theme, strong contrast, large typography, subtle gradients/glows, responsive 16:9 projection-first layout, but still usable on a laptop.

Core requirements:
1) Pre-auction setup page with player database. Player fields: name, photo, age, role (Batsman / All Rounder / Bowler), batting side (Right / Left), bowling type (Pace / Spin when applicable), nationality, base price, capped/uncapped (only relevant for Indian players), auction set. Provide exactly these mutually exclusive sets: Capped Indian Batsmen; Overseas Batsmen; Capped Indian All Rounder; Overseas All Rounder; Capped Indian Pace Bowler; Overseas Pace Bowler; Capped Indian Spin Bowler; Overseas Spin Bowler; Uncapped Indian Batsmen; Uncapped Indian All Rounder; Uncapped Indian Pace Bowler; Uncapped Indian Spin Bowler. A player must never appear in more than one set. Include a set dropdown/manual override when needed. Support add/edit/delete players and search/filter. Seed the app with a handful of realistic demo players so the UI is immediately usable, clearly labeled as demo data.
2) Team setup with team name, logo placeholder/upload support, purse amount. Seed 4-6 demo teams. Allow editing/removing teams.
3) Auction settings: purse per team, bid increment rules (support sensible default increments such as 20L below 1Cr, 25L/50L/1Cr tiers or configurable), randomization toggle, projection/display mode.
4) Start Auction button launches the live auction screen.

Live auction screen:
- Operator chooses a set, then starts auction from that set.
- Randomly select players from the chosen set when randomization is on, otherwise allow next player.
- Prominent player card with photo, name, age, role, batting side, bowling type, nationality, base price, capped/uncapped.
- Current bid amount and current highest-bidding team.
- Team buttons/cards containing team name, players bought count/list summary, and remaining purse. Clicking a team registers them as the current bidder and automatically increases the bid according to the configured increment. Prevent a team from bidding if its remaining purse cannot cover the next bid. Prevent invalid bids and clearly show why.
- SELL confirms the current highest bidder and amount, deducts purse, assigns player to that team, and adds player to squad.
- UNSOLD marks player unsold.
- Provide undo last auction action, next player, set selector, bid increment display, auction history, sold/unsold counts, and a compact event status header.
- Persist state in browser localStorage so refreshes do not destroy an active auction. Structure the code so it can later move to Supabase, but make the initial app work without requiring external credentials.

Projection/display view:
- Add a dedicated 'Projection Mode' route/view that is clean and audience-facing. It should show a huge player card, current bid, highest bidder, and a bottom team strip with each team name, players bought, and remaining purse. Hide operator controls. Include a button to open projection mode in a new tab/window if possible.
- Operator view should be dense and functional, projection view should be cinematic and readable from a distance.

Design details:
- Use a premium IPL-style visual language without copying any official IPL branding or logos. Use an original 'COLLEGE IPL AUCTION' identity.
- Strong dark navy/charcoal background, electric accent gradients, glass cards, crisp borders, stadium-light glow effects, animated bid changes, sold/unsold status animations, but keep performance good.
- Use Indian currency formatting with ₹ and display amounts sensibly in Lakhs/Crores.
- Build accessible buttons, keyboard-friendly controls, clear disabled states, and confirmation for destructive actions.
- Include an overview/dashboard landing page with counts for players, teams, total purse, and quick actions: Setup Players, Setup Teams, Auction Settings, Start Auction.
- Include an import/export-friendly player management area even if actual CSV import is not implemented; at minimum provide JSON export/import or a clearly structured data-management UI.
- No authentication needed for this first version.

Please build the complete working app, not just mockups. Make the main auction experience the visual centerpiece and ensure all core interactions work end-to-end with seeded demo data.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2fe5ba5f-fa9a-48d2-a356-74615ca5a287).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
