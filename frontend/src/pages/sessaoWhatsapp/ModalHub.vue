<template>
  <q-dialog :value="value" @hide="close" persistent>
    <q-card>
      <!-- Header fixo -->
      <q-card-section class="q-py-md">
        <div class="row items-center justify-between">
          <div class="row items-center">
            <q-icon name="mdi-cog" size="28px" class="q-mr-md" />
            <div class="text-h6 text-weight-bold">
              Alterar Hub Token
            </div>
          </div>

          <q-btn flat color="white" v-close-popup icon="eva-close" @click="close" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="modern-modal__content q-pa-md">
        <div class="q-gutter-md">
          <div class="q-pa-md bg-blue-1 rounded-borders">
            <div class="text-caption text-grey-7">
              Obtenha acesso Connection Hub em nossa loja
              <a
                href="https://loja.whazing.com.br"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary text-decoration-none"
                style="font-weight: 500"
              >
                Acesse aqui
              </a>
            </div>
          </div>

          <!-- Campo Hub Token -->
          <div class="input-group">
            <q-input v-model="hubToken" outlined dense label="Token NotificaMe">
              <template v-slot:prepend>
                <q-img
                  src="hub-logo.png"
                  style="width: 24px; height: 24px; object-fit: contain"
                  spinner-color="primary"
                />
              </template>
            </q-input>
          </div>

          <!-- Campo Connection Hub Token -->
          <div class="input-group">
            <q-input
              v-model="ConnectionHubToken"
              outlined
              dense
              label="Token Conection HUB"
            >
              <template v-slot:prepend>
                <q-img
                  src="connectionhub-logo.png"
                  style="width: 24px; height: 24px; object-fit: contain"
                  spinner-color="primary"
                />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Footer fixo -->
      <q-card-actions align="right" class="q-pa-md modern-modal__footer">
        <q-btn
          label="Cancelar"
          color="negative"
          icon="close"
          @click="close"
          class="btn-rounded-50"
        />
        <q-btn
          label="Salvar"
          class="btn-rounded-50"
          color="primary"
          icon="eva-save-outline"
          @click="saveHubToken"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ListarConfiguracoes, AlterarConfiguracao } from 'src/service/configuracoes'

export default {
  name: 'HubModal',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      hubToken: '',
      ConnectionHubToken: '',
      loading: false
    }
  },
  methods: {
    async listarConfiguracoes () {
      this.loading = true
      try {
        const { data } = await ListarConfiguracoes()
        const hubConfig = data.find((el) => el.key === 'hubToken')
        if (hubConfig) {
          this.hubToken = hubConfig.value
        }
        const ConnectionHubTokenConfig = data.find((el) => el.key === 'ConnectionHubToken')
        if (ConnectionHubTokenConfig) {
          this.ConnectionHubToken = ConnectionHubTokenConfig.value
        }
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.$t('canais.errortoken'),
          progress: true
        })
      } finally {
        this.loading = false
      }
    },
    close () {
      this.$emit('input', false)
      this.hubToken = ''
    },
    async saveHubToken () {
      this.loading = true
      const params = { key: 'hubToken', value: this.hubToken }
      const params2 = { key: 'ConnectionHubToken', value: this.ConnectionHubToken }
      try {
        await AlterarConfiguracao(params)
        await AlterarConfiguracao(params2)
        this.$q.notify({
          type: 'positive',
          message: 'Dados Hub Alterado',
          progress: true,
          actions: [{ icon: 'close', round: true, color: 'white' }]
        })
        this.$emit('input', false)
        this.close()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Erro alterar dados HUB',
          progress: true
        })
      } finally {
        this.loading = false
      }
    }
  },
  watch: {
    value (val) {
      if (val) {
        this.listarConfiguracoes()
      }
    }
  }
}
</script>
