import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

const Loader = () => (
  <FontAwesomeIcon icon={faSpinner} size='2x' spin />
);

export default Loader;
