import React from 'react';

const About = () => {
  document.title = 'About - Kingfisher';

  return (
    <div className="About">
      <div className="ui text container">
        <br />
        <div className="ui horizontal divider">About Kingfisher</div>
        <p>
          Kingfisher is an open source project created to help UIUC students
          understand course grade distributions. Inspired by projects like Madgrades,
          it visualizes historical GPA data from the University of Illinois at Urbana-Champaign
          to aid in course selection and planning.
        </p>
        <br />
        <div className="ui horizontal divider">The Data</div>
        <p>
          The data used in this project is sourced from publicly available datasets
          detailing grade distributions at UIUC over several semesters. While we strive
          for accuracy, please note that trends can change and this data should be used
          as one of many factors in your decision-making process.
        </p>
        <br />
        <div className="ui horizontal divider">Help out!</div>
        <p>
          Kingfisher is a work in progress. If you find bugs or have suggestions
          for new features, we'd love to hear from you. The project is open source
          and contributions are always welcome.
        </p>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a className="ui secondary button"
             href="https://github.com/r-thak/kingfisher-api"
             rel="noopener noreferrer"
             target="_blank">
            <i className="github icon"></i>
            View on GitHub
          </a>
        </div>
        <br />
      </div>
    </div>
  );
};

export default About;
