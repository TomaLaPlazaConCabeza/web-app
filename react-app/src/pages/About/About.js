import React, { Component } from 'react';

class About extends Component {

  render() {
    return (
      <div>
        <h1>Credits</h1>
        <p>This web-app was developed during the 48 hours HackingCovid event, an online Hackaton based in Tenerife, Canary Islands (<a href="https://hackathon.ayudadigital.org/">link</a>).</p>
        <h2>People</h2>
        <ul>
            <li>Álvaro González García (<a href="www.linkedin.com/in/álvaro-gonzález-garcía-620a17175">LinkedIn</a>). <p>Original idea, implementation of first-and very inefficient- algorithm in WolframMathematica. Manager of this no-profit project. Mentor of the team during the HackingCovid event.</p> </li>
            <li>Alessio Caglaci (<a href="www.linkedin.com/in/alessio-caciagli-65a55160">LinkedIn</a>)<p>Extension and improvement of the WolframMathematica script. First incorporation of the script in Python. Manager of the team during HackingCovid.</p></li>
            <li>James Martin (<a href="https://www.linkedin.com/in/james-l-martin-robinson-b21933100/">LinkedIn</a>). <p>Conducted calculations using the WolframMathematica script. Implementation of Langevin dynamics in Python (work on progress)</p></li>
            <li>Sander Bollen (<a href="https://www.linkedin.com/in/sander-bollen-5089758a/">LinkedIn</a>). <p>Back-end developer. Hardcore Python wizard. Making sure everything even works.</p></li>
            <li>Grazvydas Luncinskas. <p>Front-end developer. Making things look nice on a screen since computers were around.</p></li>
            <li>Cristina Hernández (<a href="https://www.instagram.com/pisandocolores/">Instagram</a>). <p>Craftwomen of jewellery and macramé at Pisando Colores (Tenerife). Checked the venting stand size and provided in-situ information about the number of itinerant vendors. She will deliver this app around the local authorities in Tenerife for its implementation.</p></li>
            <li>Maite Giordano (<a href="https://www.instagram.com/maitedepapel/">Instagram</a>). <p>Craftswoman of paper and binding. Happydelalaif. Provided ground-view information before HackingCovid. She will deliver this app around the local authorities in Tenerife for its implementation.</p></li>
        </ul>
        <h2>Source code</h2>
        <p>The source code is freely available, and licensed under a permissive BSD (BSD-3-clause) license. You can view the source code <a href="https://github.com/TomaLaPlazaConCabeza/web-app">here</a>.</p>
      </div>
    );
  }

}

export default About;
