import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string | null {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.response?.data?.code ?? null;
  }
  return null;
}

export function getApiErrorCode(error: unknown): string | null {
  if (error instanceof AxiosError) {
    return error.response?.data?.code ?? error.response?.data?.message ?? null;
  }
  return null;
}
