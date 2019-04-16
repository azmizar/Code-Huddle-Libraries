/**
 * 3rd party imports
 */
import { Observable } from 'rxjs';

/**
 * ISize interface
 */
export interface ISize {
  width: number;
  height: number;
}

/**
 * IContentSize interface
 */
export interface IContentSize {
  content: HTMLElement;
  contentSize: ISize;
}

/**
 * IAvailableSize interface
 */
export interface IAvailableSize extends ISize {
  containerSize: ISize;
  contents?: IContentSize[];
  selectedContent: IContentSize;
}

/**
 * IContainer interface
 */
export interface IContainer {
  readonly name: string;
  readonly availableSizeEvent: Observable<IAvailableSize>;
  readonly tallestContentEvent: Observable<IAvailableSize>;
  readonly containerSizeEvent: Observable<IAvailableSize>;
  readonly containerElement: HTMLElement;
  addContent(elem: HTMLElement): () => void;
  contains(elem: HTMLElement): boolean;
}
