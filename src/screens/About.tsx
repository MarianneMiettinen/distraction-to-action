import { BackButton, ScreenTitle } from "../ui";

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} label="Back to the mountain" />
        <ScreenTitle>Attributions</ScreenTitle>
        <span className="spacer" />
      </div>

      <div className="stack grow scroll records">
        <section className="panel">
          <h2 className="eyebrow screen-title panel-head">
            Artwork
          </h2>
          <p className="meta about-text">
            Margorn, the mountain, the thirty steps and the ring are drawings by{" "}
            <b className="plain">Marianne Miettinen</b>,
            polished with AI.
          </p>
        </section>

        <section className="panel">
          <h2 className="eyebrow screen-title panel-head">
            Background photograph
          </h2>
          <p className="meta about-text">
            Photo by{" "}
            <a
              className="link"
              href="https://unsplash.com/@scottwebb?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
              target="_blank"
              rel="noreferrer noopener"
            >
              Scott Webb
            </a>{" "}
            on{" "}
            <a
              className="link"
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
          <h2 className="eyebrow screen-title panel-head">
            Music and sound
          </h2>
          <p className="meta about-text">
            Music by Grand_Project. Sound effects by Dragon-Studio, Universfield,
            Rescopic Sound, Blendertimer, Metalcrow and the Freesound community,
            via Pixabay.
          </p>
        </section>

        <section className="panel">
          <h2 className="eyebrow screen-title panel-head">
            Your climb
          </h2>
          <p className="meta about-text">
            Everything you log stays on this device. There is no account and
            nothing is sent anywhere.
          </p>
        </section>
      </div>
    </div>
  );
}
