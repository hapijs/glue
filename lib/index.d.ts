declare module '@hapi/glue' {

    import { Plugin, Server, ServerOptions, ServerRegisterOptions } from '@hapi/hapi';

    export interface GlueOptions {
        relativeTo: string;
        preRegister?: ((server: Server) => Promise<void>) | undefined;
    }

    export interface GluePluginObject {
        plugin: (
            string |
            Plugin<unknown> |
            {
                plugin: string | Plugin<unknown>,
                options?: unknown,
                routes?: ServerRegisterOptions['routes']
            }
        );
        options?: unknown;
        routes?: unknown;
    }

    export interface GlueManifest {
        server: ServerOptions;
        register?: {
            plugins: GluePluginObject[],
            options?: ServerRegisterOptions
        }
    }

    export function compose(
        manifest: GlueManifest,
        options?: GlueOptions
    ): Promise<Server>;

}
