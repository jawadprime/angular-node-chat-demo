# How the custom virtual scroll works

The message list can hold thousands of messages, but only ever puts a small number of
them on the page. Here's the idea, step by step:

1. **Each message gets a height.** A new message starts with a guessed height. Once it's
   rendered, its real height is measured and remembered.
2. **Heights turn into positions.** Using those heights, the app works out how many
   pixels from the top each message starts.
3. **Only the visible messages get rendered.** Based on the current scroll position
   (plus a small buffer above and below), the app renders a short range of messages —
   never all of them.
4. **Two invisible spacers stand in for the rest.** One above, one below, sized to match
   the height of everything not rendered — so the scrollbar behaves as if every message
   were really there.
5. **Scrolling updates the range.** As you scroll, the app works out the new visible
   range and resizes the two spacers.

That's the whole idea: never render more than what's on screen, and use spacers to keep
the scrollbar honest about everything else.