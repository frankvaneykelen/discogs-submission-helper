# discogs-submission-helper

A Playwright-driven "copilot" that reduces the toil of submitting releases to
[Discogs](https://www.discogs.com) without violating Discogs' anti-automation
rules. It fills in the "Add Release" form for you — title, format, country,
notes, tracklist — from a JSON release spec, and then **pauses so you can
manually review the form and click "Submit Release" yourself**. This tool
never submits a release on its own.

## How it works

1. You (or a Gen AI prompt) produce a JSON release spec describing the release.
2. This tool loads and validates the spec against `schema/release-schema.json`.
3. Playwright opens Discogs, logs you in, and navigates to "Add Release".
4. It fills in the basic fields, format/genre/style tags, and the tracklist
   (clicking "Add Track" and filling in each new row).
5. It pauses (via Playwright Inspector) so you can review everything.
6. You manually confirm and submit the release yourself.

## Release spec JSON

See `schema/release-schema.json` for the full schema and
`examples/musique-arabe.json` for a complete example:

```json
{
  "title": "Musique Arabe",
  "format": ["Cassette", "Compilation", "Unofficial Release"],
  "country": "Unknown",
  "released": "2002",
  "genre": ["Pop", "Folk, World"],
  "style": ["Arabic Pop", "Jeel", "Shaabi"],
  "notes": "Street-market cassette; no j-card; tracklist reconstructed.",
  "tracklist": [
    { "position": "A1", "artist": "Free Baby", "title": "Baba Fein" }
  ]
}
```

`title`, `format`, and `tracklist` are required; each tracklist item requires
`position` and `title` (`artist` is optional).

## Usage

```bash
npm install

# Provide your Discogs credentials via environment variables
export DISCOGS_USERNAME=your-username
export DISCOGS_PASSWORD=your-password

npm start -- examples/musique-arabe.json
```

A browser window will open, log in, navigate to the "Add Release" form, fill
it in from the JSON, and then pause for your manual review before you submit.

## Development

```bash
npm install
npm test
```

Tests use Node's built-in test runner (`node --test`) to validate the release
spec loader/validator against the JSON schema.