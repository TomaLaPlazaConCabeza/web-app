import { API_URL } from '../constants/api';

export const postPolygons = async (request) => {
  const response = await fetch(`${API_URL}api/calculate`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const json = await response.json();

  return json;
};
