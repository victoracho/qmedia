<template>
  <div id="mediaMasterComponent">
    <!--Crud folders-->
    <crud :crud-data="import('@imagina/qmedia/_crud/folder')" type="onlyUpdate" ref="crudFolders"
          @created="refreshData" @updated="refreshData" @deleted="refreshData"
          :custom-data="customCrudData.folder"/>

    <!--Crud Files-->
    <crud :crud-data="import('@imagina/qmedia/_crud/files')" type="onlyUpdate" ref="crudFiles"
          @created="refreshData" @updated="refreshData" @deleted="refreshData"
          :custom-data="customCrudData.file"/>

    <!--Uploader-->
    <uploader v-model="filesToUpload" ref="uploaderComponent" hide-file-list @input="uploadFiles()"
              :max-files="allowSelect || 50" :accept="accept"/>

    <!--Content-->
    <div class="relative-position" v-if="!onlyUpload">
      <!--Page Actions-->
      <div class="box box-auto-height q-mb-md">
        <page-actions :extra-actions="pageActions" title="Media" @search="val => {filter.search = val}"/>
      </div>

      <!--Bread crumb-->
      <div class="box box-auto-height q-mb-md">
        <breadcrumb-component ref="breadcrumbComponent" :params="filter" @selected="setFolder"/>
      </div>

      <!---Folders Files-->
      <div class="box box-auto-height q-mb-md">
        <file-list-component v-bind="fileListParams.folderFiles" @clickItem="setFolder"/>
      </div>

      <!---Other Files-->
      <div class="box box-auto-height q-mb-md">
        <file-list-component v-bind="fileListParams.otherFiles" @selected="files => $emit('selected',files)"/>
      </div>

      <!--inner loading-->
      <inner-loading :visible="loading"/>
    </div>
  </div>
</template>
<script>
//components
import uploader from '@imagina/qsite/_components/master/uploader'
import breadcrumbComponent from '@imagina/qmedia/_components/blocks/breadcrumb'
import fileListComponent from '@imagina/qsite/_components/master/fileList'

export default {
  beforeDestroy() {
    this.$root.$off('page.data.refresh')
  },
  props: {
    disk: {default: 'publicmedia'},
    allowSelect: {type: Number, default: 0},
    onlyUpload: {type: Boolean, defualt: false},
    accept: {default: false}
  },
  components: {
    breadcrumbComponent,
    fileListComponent,
    uploader
  },
  watch: {},
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      loading: false,
      filesToUpload: [],
      listView: false,
      filter: {
        search: null,
        folderId: 0
      },
      filesComponent: null
    }
  },
  computed: {
    //page actions
    pageActions() {
      return [
        'search',
        {
          label: this.$tr('qmedia.layout.newFolder'),
          props: {
            icon: 'fas fa-folder-plus',
            label: this.$tr('qmedia.layout.newFolder'),
            round: false,
            rounded: true,
            padding: 'xs md',
            color: 'green'
          },
          action: () => this.$refs.crudFolders.create()
        },
        {
          label: this.$tr('qmedia.layout.newFile'),
          props: {
            icon: 'fas fa-file-upload',
            label: this.$tr('qmedia.layout.newFile'),
            round: false,
            rounded: true,
            padding: 'xs md',
            color: 'green'
          },
          action: () => this.$refs.uploaderComponent.pickFiles()
        }
      ]
    },
    //Item actions to file list
    itemFileListActions() {
      //Instance main actions
      let mainActions = [
        {
          label: this.$tr('ui.label.edit'),
          icon: 'fas fa-pen',
          action: (item) => {
            if (item.isFolder) this.$refs.crudFolders.update(item)
            else this.$refs.crudFiles.update(item)
          }
        },
        {
          label: this.$tr('ui.label.delete'),
          icon: 'fas fa-trash',
          action: (item) => {
            if (item.isFolder) this.$refs.crudFolders.delete(item)
            else this.$refs.crudFiles.delete(item)
          }
        }
      ]

      //Instance download action
      let downloadAction = {
        label: this.$tr('ui.label.download'),
        vIf: this.$auth.hasAccess('media.medias.download'),
        icon: 'fas fa-file-download',
        action: (item) => this.$helper.downloadFromURL(item.path)
      }

      //Response
      return {
        mainActions: mainActions,
        includeDownload: [downloadAction, ...mainActions]
      }
    },
    //Params to component files
    fileListParams() {
      return this.$clone({
        folderFiles: {
          ref: 'foldersFilesComponent',
          key: 'foldersContent',
          gridType: 'chip',
          icon: 'fas fa-folder-open',
          title: this.$trp('ui.label.folder'),
          allowCounter: true,
          allowOrder: true,
          itemActions: this.allowSelect ? [] : this.itemFileListActions.mainActions,
          allowPagination: true,
          loadFiles: {
            apiRoute: 'apiRoutes.qmedia.files',
            requestParams: {
              take: 24,
              filter: {
                ...this.filter,
                isFolder: true,
                order: {
                  field: 'created_at',
                  way: 'desc'
                },
                disk: this.disk
              }
            }
          }
        },
        otherFiles: {
          ref: 'otherFilesComponent',
          key: 'otherFiles',
          icon: 'fas fa-photo-video',
          title: this.$trp('ui.label.file'),
          allowCounter: true,
          allowOrder: true,
          itemActions: this.allowSelect ? [] : this.itemFileListActions.includeDownload,
          allowPagination: true,
          allowChangeView: true,
          allowSelect: this.allowSelect,
          loadFiles: {
            apiRoute: 'apiRoutes.qmedia.files',
            requestParams: {
              take: 24,
              filter: {
                ...this.filter,
                isFolder: false,
                order: {
                  field: 'created_at',
                  way: 'desc'
                },
                disk: this.disk,
                ...(this.accept ? {extension: this.acceptExtensions} : {})
              }
            }
          }
        }
      })
    },
    //Custom crud params
    customCrudData() {
      return {
        folder: {
          formLeft: {
            disk: {value: this.disk},
            parentId: {
              value: this.filter.folderId ? this.filter.folderId : '0',
              type: 'treeSelect',
              props: {
                label: this.$tr('ui.form.parent'),
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
          }
        },
        file: {
          formLeft: {
            disk: {value: this.disk},
            folderId: {
              value: this.filter.folderId ? this.filter.folderId : '0',
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
            }
          }
        }
      }
    },
    //Accept extensions
    acceptExtensions() {
      let accept = this.$clone(this.accept ? this.accept.split(',') : [])
      let response = []

      //Get extensions settings
      let extensions = {
        images: this.$store.getters['qsiteApp/getSettingValueByName']('media::allowedImageTypes'),
        videos: this.$store.getters['qsiteApp/getSettingValueByName']('media::allowedVideoTypes'),
        audio: this.$store.getters['qsiteApp/getSettingValueByName']('media::allowedAudioTypes'),
        files: this.$store.getters['qsiteApp/getSettingValueByName']('media::allowedFileTypes')
      }

      //Parse extensions
      accept.forEach(extensionName => {
        if (extensions[extensionName]) response = [...response, ...extensions[extensionName]]
        else response = [...response, extensionName]
      })

      //Response
      return response
    }
  },
  methods: {
    init() {
      this.$root.$on('page.data.refresh', () => this.refreshData())
    },
    //upload files
    async uploadFiles() {
      //Loading
      this.loading = true
      //Instance filesUploaded data
      let filesUploaded = []

      //Get files and check be a array
      let files = this.$clone(this.filesToUpload || [])
      if (!Array.isArray(files)) files = [files]

      //Emit uploaded files
      this.$emit('uploading', this.$clone(files))

      //Upload files
      await Promise.all(files.map(async file => {
        //format request
        let fileData = new FormData()
        fileData.append('parent_id', this.filter.folderId || 0)
        fileData.append('disk', this.disk)
        fileData.append('file', file.file)

        //Request send file
        await this.$crud.post('apiRoutes.qmedia.files', fileData).then(response => {
          filesUploaded.push(response.data)
        })
      }))

      //Emit uploaded files
      this.$emit('uploaded', this.$clone(filesUploaded))

      //Loading
      if (files.length) this.refreshData()
      this.filesToUpload = []
      this.loading = false
    },
    //Set folder
    setFolder(file) {
      if (file.isFolder) this.filter = {folderId: file.id, search: null}
    },
    //Refresh Data
    refreshData() {
      setTimeout(() => {
        if (this.$refs.breadcrumbComponent) this.$refs.breadcrumbComponent.getData(true)
        if (this.$refs.foldersFilesComponent) this.$refs.foldersFilesComponent.getData(true)
        if (this.$refs.otherFilesComponent) this.$refs.otherFilesComponent.getData(true)
      }, 100)
    },
    //Pick Files
    directUpload() {
      this.$refs.uploaderComponent.pickFiles()
    }
  }
}
</script>
<style lang="stylus">
//#mediaMasterComponent
</style>
