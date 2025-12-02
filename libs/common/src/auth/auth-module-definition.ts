import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { Auth } from './auth';

export interface AuthModuleOptions {
  auth: Auth;
  disableTrustedOriginsCors?: boolean;
  disableBodyParser?: boolean;
  disableGlobalAuthGuard?: boolean;
}

export const MODULE_OPTIONS_TOKEN = Symbol('AUTH_MODULE_OPTIONS');

export const { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<AuthModuleOptions>({
    optionsInjectionToken: MODULE_OPTIONS_TOKEN,
  })
    .setClassMethodName('forRoot')
    .setExtras(
      {
        isGlobal: true,
        disableTrustedOriginsCors: false,
        disableBodyParser: false,
        disableGlobalAuthGuard: false,
      },
      (def, extras) => {
        // Combina las opciones proporcionadas con las opciones predeterminadas
        const optionsProvider = def.providers?.find(
          (p): p is { provide: symbol; useValue: AuthModuleOptions } =>
            typeof p === 'object' &&
            p !== null &&
            'provide' in p &&
            p.provide === MODULE_OPTIONS_TOKEN
        );

        if (optionsProvider && 'useValue' in optionsProvider) {
          optionsProvider.useValue = {
            ...optionsProvider.useValue,
            ...extras,
          } as AuthModuleOptions;
        }

        return {
          ...def,
          global: extras.isGlobal,
        };
      }
    )
    .build();
