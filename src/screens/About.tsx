import { BackButton } from "../ui";

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} label="Back to the mountain" />
        <p className="eyebrow" style={{ color: "var(--muted)" }}>
          Attributions
        </p>
        <span style={{ width: "2.9rem" }} />
      </div>

      <div className="stack grow scroll" style={{ gap: "1rem" }}>
        <section className="panel">
          <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: ".5rem" }}>
            Artwork
          </p>
          <p className="meta" style={{ fontSize: ".88rem" }}>
            Margorn, the mountain, the thirty steps and the ring are drawings by{" "}
            <b style={{ color: "var(--parchment)" }}>Marianne Miettinen</b>,
            polished with AI.
          </p>
        </section>

        <section className="panel">
          <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: ".5rem" }}>
            Background photograph
          </p>
          <p className="meta" style={{ fontSize: ".88rem" }}>
            Photo by{" "}
            <a
              className="link"
              style={{ fontSize: "inherit", color: "var(--gold-bright)" }}
              href="https://unsplash.com/@scottwebb?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
              target="_blank"
              rel="noreferrer noopener"
            >
              Scott Webb
            </a>{" "}
            on{" "}
            <a
              className="link"
              style={{ fontSize: "inherit", color: "var(--gold-bright)" }}
              href="https://unsplash.com/photos/a-black-and-white-photo-of-a-marble-surface-UjupleczBOY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
              target="_blank"
              rel="noreferrer noopener"
            >
              Unsplash
            </a>
            .
          </p>
        </section>

        <section className="panel">
          <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: ".5rem" }}>
            Music and sound
          </p>
          <p className="meta" style={{ fontSize: ".88rem" }}>
            Music by Grand_Project. Sound effects by Dragon-Studio, Universfield,
            Rescopic Sound, Blendertimer, Metalcrow and the Freesound community,
            via Pixabay.
          </p>
        </section>

        <section className="panel">
          <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: ".5rem" }}>
            Your climb
          </p>
          <p className="meta" style={{ fontSize: ".88rem" }}>
            Everything you log stays on this device. There is no account and
            nothing is sent anywhere.
          </p>
        </section>
      </div>
    </div>
  );
}
