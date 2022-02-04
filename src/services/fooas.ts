import axios from 'axios';

const BASE_URL = `https://foaas.com`;
const DEFAULT_ACCEPT = 'application/json';

type Accept = 'application/json';

type Config = {
  accept?: Accept,
}

export async function getAbsolutelyMessage(company: string, from: string, {
  accept = DEFAULT_ACCEPT,
} : Config = {}) {

  const { data } = await axios.get(`${BASE_URL}/absolutely/${company}/${from}`, {
    headers: {
      accept,
    },
  });

  return data;
}