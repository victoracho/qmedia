<template></template>
<script>
export default {
  data() {
    return {
      crudId: this.$uid()
    }
  },
  computed: {
    crudData() {
      return {
        crudId: this.crudId,
        apiRoute: 'apiRoutes.qmedia.files',
        permission: 'media.medias',
        create: {
          title: this.$tr('qmedia.layout.newFile'),
          method: this.create
        },
        read: {},
        update: {
          title: this.$tr('qmedia.layout.updateFile')
        },
        delete: true,
        formLeft: {
          id: {value: ''},
          userId: {value: this.$store.state.quserAuth.userId},
          file: {
            value: null,
            type: 'uploader',
            props: {
              vIf: (this.crudInfo.typeForm == 'create') ? true : false,
              title: this.$trp('ui.label.file'),
              gridColClass: 'col-xs-12'
            }
          },
          altAttribute: {
            value: '',
            type: 'input',
            isTranslatable: true,
            props: {
              label: `${this.$tr('ui.form.name')}`,
              rules: [
                val => !val || this.$helper.validateSlugFormat(val) || this.$tr('ui.message.mustContainAlphanumeric')
              ]
            },
          },
          folderId: {
            value: '0',
            type: 'treeSelect',
            props: {
              label: this.$tr('ui.label.folder'),
              clearable: false,
              options: [
                {label: this.$tr('ui.message.noValue'), value: '0', id: '0'}
              ]
            },
            loadOptions: {
              apiRoute: 'apiRoutes.qmedia.files',
              requestParams: {filter: {isFolder: true}},
              select: {label: 'filename', id: 'id', parentId: 'folderId'}
            }
          },
          description: {
            value: '',
            type: 'input',
            isTranslatable: true,
            props: {
              label: `${this.$tr('ui.form.description')}`,
              type: 'textarea',
              rows: "3",
            },
          },
        },
        formRight: {},
      }
    },
    //Crud info
    crudInfo() {
      return this.$store.state.qcrudComponent.component[this.crudId] || {}
    }
  },
  methods: {
    //Custom method to create
    create(formData) {
      return new Promise(async (resolve, reject) => {
        //Upload only file
        let fileData = new FormData()
        fileData.append('parent_id', formData.folderId || 0)
        fileData.append('file', formData.file)

        //Request send file
        await this.$crud.post(this.crudData.apiRoute, fileData).then(response => {
          let file = response.data//get media file
          delete formData.file//Remove file data (base64) from form data
          formData.id = file.id//Set Id to form data
          //update media file info
          this.$crud.update(this.crudData.apiRoute, file.id, formData).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }).catch(error => {
          reject(error.response.data.errors)
        })
      })
    }
  }
}
</script>
