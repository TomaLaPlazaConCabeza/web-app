import React, { Component } from 'react';

class Home extends Component {

  render() {
    return (
      <div>
        <h1>Introduction</h1>
        <p>A gradual and secure return to our public spaces is paramount in this first phase of the halt to the lockdown due to the outbreak of COVID-19 worldwide. At this moment, any tool towards a simple, rational, and versatile re-design of our public spaces is an immediate necessity. Here, we present an app for predicting the capacity of plazas constrained to social distancing. In order to somehow mimic the free will of individuals, we choose to generate very loose random packings in the confined area defined by the perimeter of the plaza. Individuals are treated as hard discs whose radius is user-defined. </p>
        <p>Further information about the model is available free of charge at:</p>
        <p><a href="https://arxiv.org/abs/2005.07038">https://arxiv.org/abs/2005.07038</a></p>
        <h2>The current web-app allows:</h2>
        <p>An intuitive user interface. Draw your favorite plaza, draw eventual obstacles, get the number of people that can fit in! (COVID-approved).</p>
        <p>You can set the minimum “security distance” that people need to respect. You can also simulate the presence of barriers at the edges of the map by setting their size.</p>
        <p>This allows you to estimate, for instance, the number of people allowed for an event (e.g., a Sunday market, a concert, etc.)</p>
        <h2>Future implementations</h2>
        <ol>
            <li>Beyond Stochastic: Dynamics of the people in the plazas.</li>
            <li>Love is in the air: Accounting for couples.</li>
            <li>Softening the exclusion zone: Model people as soft discs instead of hard discs.</li>
            <li>Panic!: Implementation of escape routes.</li>
            <li>Public vs private: albeit the app is designed for public spaces, the algorithm will work also in a private space. You only need to provide the floor map from the pertinent authority (e.g., social event organizers, lab-spaces, classrooms, etc). Please, feel free to reach us if you are interested.</li>
        </ol>
        <p>Please feel free to reach us to extend this list at <a>comunicacion@ayudadigitalcovid.org</a></p>
      </div>
    );
  }

}

export default Home;
