import {defineStore} from 'pinia'

export const useCoreStore = defineStore('core', {
  state: () => ({
    isLoad: true,
    snackbarMessage: {},
    modalLoad: false,
    modalInfo: false,
    modalInfoText: '',
    snackbarShow: false,
  }),
  getters: {
    yesNoList() {
      return [
        {
          'id': true,
          'name': 'Да',
        },
        {
          'id': false,
          'name': 'Нет',
        },
      ]
    },
    yesNoNullList() {
      return [
        {
          'id': true,
          'name': 'Да',
        },
        {
          'id': false,
          'name': 'Нет',
        },
        {
          'id': null,
          'name': '-',
        },
      ]
    },
  },
  actions: {
    showAlert(data = {text: '', color: 'white'}) {
      this.snackbarMessage.text = data.text;
      this.snackbarMessage.color = data.color;
      this.snackbarShow = true
    },

    showAlertInfo(text) {
      this.snackbarMessage.text = text;
      this.snackbarMessage.color = 'primary';
      this.snackbarShow = true
    },

    showModalInfo(text) {
      this.modalInfoText = text;
      this.modalInfo = true
    },

    showAlertError(text) {
      this.snackbarMessage.text = text;
      this.snackbarMessage.color = 'red';
      this.snackbarShow = true
    },
  },
})
