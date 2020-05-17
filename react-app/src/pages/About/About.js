import React, { Component } from 'react';

class About extends Component {

  render() {
    return (
      <div>
        <h1>Credits</h1>
        <p>This web-app was developed during the 48 hours HackingCovid event, an online Hackaton based in Tenerife, Canary Islands (<a href="https://hackathon.ayudadigital.org/">link</a>)</p>
        <h2>People</h2>
        <ul>
            <li>Álvaro González García (<a href="www.linkedin.com/in/álvaro-gonzález-garcía-620a17175">LinkedIn</a>). <p>Original idea, implementation of first-and very inefficient- algorithm in WolframMathematica. Manager of this no-profit project. Mentor of the team during the HackingCovid event.</p> </li>
            <li>Alessio Caglaci (LinkedIn)<p>Extension and improvement of the WolframMathematica script. First incorporation of the script in Python. Manager of the team during HackingCovid.</p></li>
            <li>James Martin (LinkedIn). <p>Conducted calculations using the WolframMathematica script. Implementation of Langevin dynamics in Python (work on progress)</p></li>
            <li>Sander Bollen (LinkedIn). <p>Back-end developer. Hardcore Python wizard. Making sure everything even works.</p></li>
            <li>Grazvydas Luncinskas (LinkedIn). <p>Front-end developer. Making things looking nice since the beginning of the universe</p></li>
            <li>Cristina Hernández (instagram). <p>Craftwomen of jewellery and macramé at Pisando Colores (Tenerife). Checked the venting stand size and provided in-situ information about number of itinerant vendors.</p></li>
            <li>Maite Giordano (instagram). <p>Craftwomen of paper and binding. Happydelalaif. Provided ground-view information before HackingCovid.</p></li>
        </ul>
      </div>
    );
  }

}

export default About;
