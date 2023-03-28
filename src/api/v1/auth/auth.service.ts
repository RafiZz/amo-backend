import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

type OAuthResponseData = {
  token_type: string; // 'Bearer';
  expires_in: number; // 86400;
  access_token: string;
  refresh_token: string;
};

enum GRANT_TYPES {
  authorization_code = 'authorization_code',
  refresh_token = 'refresh_token',
}

type AuthorizationCodePayload = {
  grant_type: GRANT_TYPES.authorization_code;
  code: string;
};

type RefreshTokenPayload = {
  grant_type: GRANT_TYPES.refresh_token;
  refresh_token: string;
};

@Injectable()
export class AuthService {
  private readonly logger = console;

  constructor(private readonly httpService: HttpService) {}

  async refresh({
    refresh_token,
  }: {
    refresh_token: string;
  }): Promise<OAuthResponseData> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<OAuthResponseData>(
          '/oauth2/access_token',
          {
            client_id: process.env.AMOCRM_CLIENT_ID,
            client_secret: process.env.AMOCRM_CLIENT_SECRET,
            redirect_uri: process.env.AMOCRM_REDIRECT_URI,
            grant_type: 'refresh_token',
            refresh_token,
          },
          {
            baseURL: process.env.AMOCRM_URL,
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw 'An error happened!';
          }),
        ),
    );
    this._setAccessToken(data.access_token);
    return data;
  }

  async auth({ code }: { code: string }): Promise<OAuthResponseData> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<OAuthResponseData>(
          '/oauth2/access_token',
          {
            client_id: process.env.AMOCRM_CLIENT_ID,
            client_secret: process.env.AMOCRM_CLIENT_SECRET,
            redirect_uri: process.env.AMOCRM_REDIRECT_URI,
            grant_type: 'authorization_code',
            code,
          },
          {
            baseURL: process.env.AMOCRM_URL,
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw 'An error happened!';
          }),
        ),
    );
    this._setAccessToken(data.access_token);
    return data;
  }

  _AMOCRMaccessTokenRequest(
    payload: AuthorizationCodePayload | RefreshTokenPayload,
  ) {
    let cleanedPayload: AuthorizationCodePayload | RefreshTokenPayload;
    if (payload.grant_type === GRANT_TYPES.authorization_code) {
      cleanedPayload = {
        grant_type: payload.grant_type,
        code: payload.code,
      };
    } else if (payload.grant_type === GRANT_TYPES.refresh_token) {
      cleanedPayload = {
        grant_type: payload.grant_type,
        refresh_token: payload.refresh_token,
      };
    } else {
      throw new Error(
        `This payload is not allowed: ${JSON.stringify(payload)}`,
      );
    }

    return firstValueFrom(
      this.httpService
        .post<OAuthResponseData>(
          '/oauth2/access_token',
          {
            client_id: process.env.AMOCRM_CLIENT_ID,
            client_secret: process.env.AMOCRM_CLIENT_SECRET,
            redirect_uri: process.env.AMOCRM_REDIRECT_URI,
            ...cleanedPayload,
          },
          {
            baseURL: process.env.AMOCRM_URL,
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw 'An error happened!';
          }),
        ),
    );
  }

  _setAccessToken(token: string) {
    process.env.AMOCRM_ACCESS_TOKEN = token;
  }
}
