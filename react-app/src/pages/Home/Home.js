import React, { Component } from 'react';

class Home extends Component {

  render() {
    return (
      <div>
        <h1>Introduction</h1>
        <p>A gradual and secure return to our public spaces is paramount in this first phase of the halt to the lockdown due to the outbreak of COVID-19 worldwide. At this moment, any tool towards a simple, rational, and versatile re-design of our public spaces is an immediate necessity. Here, we present a model for predicting the capacity of plazas constrained to social distancing. In order to somehow mimic the free will of individuals, we choose to generate very loose random packings in the confined area defined by the perimeter of the plaza. Individuals are modelled as hard discs whose radius is user-defined. Further information about the algorithm set-up is available free of charge <a href="https://arxiv.org/abs/2005.07038">here</a>.</p>
        <h2>The current web-app allows:</h2>
        <p>An intuitive user interface. Draw your favorite plaza, collect the COVID-approved population.</p>
        <p>Add obstacles by simple drawing them in the plaza.</p>
        <p>Closing the plaza and set an event on it (e.g., a Sunday market, a concert, etc)</p>
        <p>Future implementations considered can be found below the interactive map.</p>
        <h2>Future implementations</h2>
        <ol>
            <li>Beyond Stochastic: Langevin dynamics of the people in the plazas.</li>
            <li>Love is in the air: Accounting for couples as rod-like particles.</li>
            <li>Softening the exclusion zone: Accounting for soft discs instead of hard discs.</li>
            <li>Panic!: Implementation of escape routes.</li>
            <li>Public vs private: the algorithm will work the same in a private space, provided the floor map from the pertinent authority (e.g., social event organizers, lab-spaces, classrooms, etc). Please, feel free to reach us.</li>
        </ol>
        <p>please feel free to reach us to extend this list at <a mailto="comunicacion@ayudadigitalcovid.org">comunicacion@ayudadigitalcovid.org</a></p>
      </div>
    );
  }

}

export default Home;
