export default function Instructions() {
  return (
    <div className="section instructions">
      <div className="section-header">
        <h2>How This Works</h2>
      </div>

      <p className="instructions-lede">
        This is a site for making a packing list. It's designed to be more than just
        a replacement for a pad and a pen. It not only looks up the weather where
        you're going for the dates that you're traveling, it's also going to learn
        from you over time.
      </p>

      <div className="instructions-step card">
        <div className="instructions-step-num">1</div>
        <div className="instructions-step-body">
          <h3>Tell us about your family</h3>
          <p>
            Start by entering info about the people in your family who travel. Feel
            free to put in some conditional logic, like <em>"suntan lotion if the
            weather will be over 80 degrees"</em> or <em>"heart medicine if I'm going
            to be traveling from before a Monday till after a Monday"</em>.
          </p>
        </div>
      </div>

      <div className="instructions-step card">
        <div className="instructions-step-num">2</div>
        <div className="instructions-step-body">
          <h3>Set your family rules</h3>
          <p>
            Also check out the Rules tab if there are specific rules that should
            always be kept in mind for your family. Things like <em>"The kids get
            iPads, but only when a trip involves a flight"</em> or <em>"always make
            sure to pack 4 extra sets of underwear for Mira"</em>.
          </p>
        </div>
      </div>

      <div className="instructions-step card">
        <div className="instructions-step-num">3</div>
        <div className="instructions-step-body">
          <h3>Plan your trips</h3>
          <p>
            Now you're set up with the basics about how your family operates. Now
            you can just plan your trips. Feel free to type in the dates and the
            locations of travel, or just upload pdfs or other travel documents and
            the site will build out your trip itinerary, dates, weather, and more.
            Then it'll build you a packing list.
          </p>
        </div>
      </div>

      <div className="instructions-step card">
        <div className="instructions-step-num">4</div>
        <div className="instructions-step-body">
          <h3>Shape the list</h3>
          <p>
            When you look at the list it builds you, feel free to either give
            overall recommendations to Claude at the bottom of the page (<em>"we'll
            be hanging out at a beach — give us more beach gear and stuff to do at
            the beach"</em>) or go in and update rules on the rules page (<em>"never
            pack lip balm for Dad — he doesn't ever use it"</em>).
          </p>
        </div>
      </div>

      <div className="instructions-outro">
        <p>
          You can even go back and give feedback about what worked and what didn't
          so that the lists get smarter over time.
        </p>
      </div>
    </div>
  )
}
