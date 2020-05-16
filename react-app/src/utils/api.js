import { API_URL } from '../constants/api';

export const postPolygons = (request) => {
  return fetch(`${API_URL}api/calculate`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
};
