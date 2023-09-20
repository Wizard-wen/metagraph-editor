/**
 * @author songxiwen
 * @date  2021/11/22 00:04
 */

import { IndexdbService } from '@/service/indexdb.service';
import type { JSONContent } from '@tiptap/vue-3';
import { message } from 'ant-design-vue';
import type {
  EntityCompletelyListItemType,
  KnowledgeResponseType,
  SectionModelType
} from '@metagraph/constant';
import { SectionEntityType, SectionTreeNodeUIType } from '@metagraph/constant';
import { reactive, ref } from 'vue';
import { tiptapInitData } from '@/components/tiptap-text-editor/tiptap.init.data';
import { EntityApiService, SectionApiService, SectionNoAuthApiService } from '@/api-service';
import type { TreeItemType } from '@/components/metagraph-tree/type';

export type SectionOperationType =
  'CreateSection'
  | 'BindEntityToSection'
  | 'UpdateSection'
  | 'DeleteSection';

export const sectionModalData = reactive<{
  operationType: SectionOperationType;
  title: '新建文档' | '修改文档名' | '绑定知识点';
  parentSectionId?: string;
  parentSectionName?: string;
  entityOptionList: { key: string; label: string; value: string }[];
  isConfirmLoading: boolean;
}>({
  operationType: 'CreateSection',
  title: '新建文档',
  entityOptionList: [],
  isConfirmLoading: false
});

export const sectionModalForm = reactive({
  sectionName: '',
  selectedEntityId: ''
});

export const sectionModalFormRules = ref({});

function generateSectionTree(tree: SectionTreeNodeUIType[]): TreeItemType[] {
  return tree.map((item: SectionTreeNodeUIType) => {
    const newItem = {
      title: item.title,
      name: item.title,
      key: item.key,
      data: item
    };
    if (item.children) {
      const newList = generateSectionTree(item.children);
      return {
        ...newItem,
        children: newList
      };
    }
    return newItem;
  });
}

export const sectionTree = reactive<{
  metaTree: TreeItemType[],
  selectedSectionId: string
}>({
  metaTree: [],
  selectedSectionId: ''
});

export const currentSectionNode = reactive<{
  title: string;
  content: JSONContent;
  contentHtml: string;
  sectionId: string;
  entityList: EntityCompletelyListItemType[];
}>({
  title: '',
  content: tiptapInitData,
  contentHtml: '',
  sectionId: '',
  entityList: []
});

export class SectionTreePreviewService {
  /**
   * @param repositoryEntityId 知识库entity id
   * @param selectedSectionId 可选，如果是页面刷新会传入一个初始化的sectionId
   */
  static async getSectionTree(repositoryEntityId: string, selectedSectionId?: string): Promise<void> {
    const response = await SectionNoAuthApiService.getNormalSectionTree({ repositoryEntityId });
    if (response.data) {
      sectionTree.metaTree = generateSectionTree(response.data);
      if (response.data.length) {
        const currentSectionId = selectedSectionId ?? response.data[0].key;
        // 如果section存在，那么选中第一个，获取section article
        await this.setSectionContent(currentSectionId, repositoryEntityId);
        sectionTree.selectedSectionId = currentSectionId;
      } else {
        sectionTree.selectedSectionId = '';
      }
    }
  }

  static async selectTreeNode(params: {
    sectionId: string,
    repositoryEntityId: string
  }): Promise<void> {
    sectionTree.selectedSectionId = params.sectionId;
    // 如果点击的是section
    // 切换section tree之前应该保存之前的section article
    await this.setSectionContent(params.sectionId, params.repositoryEntityId);
  }

  /**
   * 获取section content
   * @param sectionId 单元id
   * @param repositoryEntityId 知识库id
   * @private
   */
  static async setSectionContent(sectionId: string, repositoryEntityId: string): Promise<void> {
    const result = await SectionNoAuthApiService.getSectionArticle({ sectionId });
    if (result.data) {
      currentSectionNode.content = JSON.parse(result.data.article.content);
      currentSectionNode.contentHtml = result.data.article.contentHtml;
      currentSectionNode.title = result.data.article.title;
      currentSectionNode.sectionId = sectionId;
      currentSectionNode.entityList = result.data.entityList;
      await IndexdbService.getInstance()
        .put('repository', {
          id: sectionId,
          name: currentSectionNode.title,
          content: currentSectionNode.contentHtml,
          sectionId,
          repositoryEntityId
        });
    }
  }

  /**
   * 初始化目录
   */
  static initSectionView(): void {
    currentSectionNode.title = '';
    currentSectionNode.content = tiptapInitData;
    currentSectionNode.contentHtml = '';
    currentSectionNode.sectionId = '';
    currentSectionNode.entityList = [];
    sectionTree.selectedSectionId = '';
  }
}