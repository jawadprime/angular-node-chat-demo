import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config';
import { CreatedThread, IssuedToken } from './chat-api.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);

  fetchToken(appUserId: string): Promise<IssuedToken> {
    return firstValueFrom(
      this.http.get<IssuedToken>(`${API_BASE_URL}/v1/chat/token`, {
        headers: { 'x-user-id': appUserId },
      }),
    );
  }

  createThread(hostUserId: string, participantAppUserIds: string[], topic: string): Promise<CreatedThread> {
    return firstValueFrom(
      this.http.post<CreatedThread>(
        `${API_BASE_URL}/v1/chat/threads`,
        { participantAppUserIds, topic },
        { headers: { 'x-user-id': hostUserId } },
      ),
    );
  }

  // Handed to AzureCommunicationTokenCredential so the ACS SDK refreshes the
  // token proactively before it expires.
  createTokenRefresher(appUserId: string): () => Promise<string> {
    return async () => (await this.fetchToken(appUserId)).token;
  }
}
