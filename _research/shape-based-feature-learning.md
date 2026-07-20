---
layout: research_item
title: "Are nuclear masks all you need for improved out-of-domain generalisation? A closer look at cancer classification in histopathology"
short_title: "Nuclear masks for robust histopathology"
slug: shape-based-feature-learning
year: 2024
date: 2024-09-24
venue: "NeurIPS"
status: Published
authors:
  - "Dhananjay Tomar"
  - "Alexander Binder"
  - "Andreas Kleppe"
role: "First author"
featured: true
draft: false
image: /assets/images/research/shape-based-feature-learning/hero-original-mask.png
image_alt: "An H&E-stained histopathology tile beside its binary nuclear segmentation mask."
tags:
  - computational pathology
  - domain generalisation
  - representation learning
  - robustness
  - computer vision
paper_url: https://proceedings.neurips.cc/paper_files/paper/2024/hash/4cc4cc789849230a4f495a2060b45c87-Abstract-Conference.html
preprint_url: https://arxiv.org/abs/2411.09373
code_url: https://github.com/undercutspiky/SFL
project_url: https://neurips.cc/virtual/2024/poster/96177
video_url: https://www.youtube.com/watch?v=zalQrK5p7x8
dataset_url: https://doi.org/10.18710/NXPLFL
doi: 10.52202/079017-1378
citation: "Tomar, D., Binder, A., and Kleppe, A. (2024). Are nuclear masks all you need for improved out-of-domain generalisation? A closer look at cancer classification in histopathology. Advances in Neural Information Processing Systems, 37, 43499–43532."
bibtex: |
  @inproceedings{tomar2024nuclear,
    title     = {Are nuclear masks all you need for improved out-of-domain generalisation? A closer look at cancer classification in histopathology},
    author    = {Tomar, Dhananjay and Binder, Alexander and Kleppe, Andreas},
    booktitle = {Advances in Neural Information Processing Systems},
    volume    = {37},
    pages     = {43499--43532},
    year      = {2024},
    doi       = {10.52202/079017-1378}
  }
summary: >-
  Models trained on data from one hospital often struggle when used on data from other hospitals. We guide the training of a standard image classifier using nuclear masks, helping it focus more on nuclear shape and arrangement. This approach improves accuracy and robustness across hospitals, and the model does not need masks during testing.
contributions:
  - "A method that uses nuclear segmentation masks, only during training, to steer a classifier towards nuclear morphology and organisation & does not require nuclear masks at inference time."
  - "A comparison with popular stain normalisation, data augmentation, and single-domain generalisation methods across CAMELYON17, BCSS, and OCELOT datasets."
  - "Robustness experiments covering common image corruptions, adversarial attacks and cross-model attack transfer. Many ablation experiments."
---

## The problem

Histopathology is the study of disease (pathology) in tissue (histo-). Deep learning papers in histopathology most commonly look at tissues with tumours that may be cancerous.  A tissue sample is cut into a very thin slice, stained, placed on a glass slide, and scanned into a digital image (scan). In the common haematoxylin-and-eosin (H&E) stain, nuclei usually appear blue or purple while much of the surrounding tissue appears pink.

These colours are helpful, but they are not fixed features of the disease. Scans can look different because hospitals use different staining methods, scanners, tissue processing, or even batches of the same stain. As a result, a model may work well on data from its training hospital but fail when the biology is similar but the image appearance changes.

Our paper asks a simple question: **Can we make a cancer classifier depend less on hospital-specific appearance and more on biological structure that stays useful across hospitals?**

<figure class="research-figure">
  <img
    src="/assets/images/research/shape-based-feature-learning/ablation-grid.png"
    alt="An H&E-stained tissue tile, its nuclear mask, and variants that retain or remove different kinds of information."
    loading="lazy"
  >
  <figcaption>
    The original image, its nuclear mask, and several controlled
    ablations used to separate nuclear shape from colour, texture,
    and surrounding tissue.
  </figcaption>
</figure>

## The idea

Cancer affects the shape and arrangement of cells, especially their nuclei. Cells may become larger, irregular, crowded, or look unusual. Pathologists look for these changes and consider the overall tissue context when diagnosing and grading cancer.

We tested a cancerous vs non-cancerous image classifier on a very simple representation: binary masks that show only the nuclei in white and make everything else black. These masks preserve only nuclear shape and arrangement.

This result was a turning point for the project. A model trained only on nuclear masks from just one hospital could still perform the classification task well, but crucially it also worked well on data from other hospitals. Nuclear morphology & organisation were not just a weak extra signal; they had enough information for the classification task.

However, a system that uses only masks would need a segmentation model during testing. Our goal was to use masks **only to guide training**, and then not need them afterward. We developed a method that could exactly do that.

## How the method works

During training, the same ResNet-50 processes two aligned inputs:

1. the original H&E image, or occasionally the image multiplied by its nuclear mask; and
2. the corresponding binary nuclear mask.

The model is trained to classify both inputs. But crucially, we minimise the Euclidean distance between their feature maps before global average pooling. In other words, we encourage the representation of the ordinary image to resemble the representation produced when colour and most non-nuclear information have been removed. Minimising the Euclidean distance between the two representations is where the magic lies.

<figure class="research-figure">
  <img
    src="/assets/images/research/shape-based-feature-learning/method.png"
    alt="Diagram of the two-branch training method. The H&E image and nuclear mask pass through a shared ResNet-50, with classification losses on both branches and a feature-alignment loss between their embeddings."
    loading="lazy"
  >
  <figcaption>
    The masks are needed only while training. At inference time, the model receives an ordinary H&E image.
  </figcaption>
</figure>

The image-times-mask input acts as a bridge between a full-colour image and a binary mask. It retains the appearance of nuclei while suppressing the surrounding tissue, making the alignment objective (Euclidean distance) easier to optimise. We also delayed the alignment loss for the first few epochs because applying it immediately sometimes leaves the network in a collapsed state.

## Evaluation

We trained models on one medical centre (hospital) from CAMELYON17 at a time and evaluated them on the other four centres. We then tested the final models on two external datasets:

- **BCSS**, containing primary breast-cancer tissue from TCGA; and
- **OCELOT**, containing primary tumours from six organs.

The external datasets were held back until the final evaluation. We compared against ordinary empirical risk minimisation (ERM), Macenko stain normalisation, RandStainNA, RSC, L2D, DDCA, and a model initialised from HoVer-Net weights. Among the baselines, L2D performed best, while ERM (with or without Macenko normalisation) is the most commonly used method in the histopathology community.

<div
  class="article-table-scroll"
  role="region"
  aria-label="Headline out-of-domain accuracy results"
  tabindex="0"
  >
  <table class="article-table">
    <caption>
      Average out-of-domain tile-classification accuracy (%),
      reported as mean ± standard deviation.
    </caption>

    <thead>
      <tr>
        <th scope="col">Method</th>
        <th scope="col">CAMELYON17</th>
        <th scope="col">BCSS</th>
        <th scope="col">OCELOT</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <th scope="row">ERM-Aug</th>
        <td>
          85.5
          <span class="table-uncertainty">± 1.8</span>
        </td>
        <td>
          71.7
          <span class="table-uncertainty">± 2.3</span>
        </td>
        <td>
          65.6
          <span class="table-uncertainty">± 2.1</span>
        </td>
      </tr>

      <tr>
        <th scope="row">L2D-Aug</th>
        <td>
          89.1
          <span class="table-uncertainty">± 1.1</span>
        </td>
        <td>
          75.1
          <span class="table-uncertainty">± 1.3</span>
        </td>
        <td>
          69.1
          <span class="table-uncertainty">± 1.1</span>
        </td>
      </tr>

      <tr class="article-table-best">
        <th scope="row">Ours-Aug</th>
        <td>
          <strong>91.8</strong>
          <span class="table-uncertainty">± 0.9</span>
        </td>
        <td>
          <strong>78.8</strong>
          <span class="table-uncertainty">± 1.6</span>
        </td>
        <td>
          <strong>70.6</strong>
          <span class="table-uncertainty">± 1.0</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>


With photometric augmentation, our method reached average accuracies of **91.8% on CAMELYON17**, **78.8% on BCSS**, and **70.6% on OCELOT**. The corresponding L2D results were 89.1%, 75.1%, and 69.1%; the ordinary augmented baseline reached 85.5%, 71.7%, and 65.6%.

The important result is not simply that nuclear guidance replaced colour augmentation. The two were complementary: conventional augmentation broadened the visual variation seen during training, while nuclear alignment encouraged the model to preserve a biologically meaningful signal across that variation.

## Robustness beyond hospital shifts

We also tested common image corruptions such as blur, compression, elastic deformation, and several kinds of noise. Models trained with our method generally degraded more slowly than other methods.

The adversarial results were particularly revealing. Under a projected-gradient attack, our models remained accurate at perturbation strengths that caused large drops for ERM and L2D. We also generated attacks using one family of models and evaluated those perturbed images on another family. Perturbed images generated using other models did not fool our method’s models much, while the reverse was not true.

<figure class="research-figure">
  <img
    src="/assets/images/research/shape-based-feature-learning/cross-model-attacks.png"
    alt="Two adversarial-robustness plots: direct PGD attacks and attacks transferred between models trained with different methods."
    loading="lazy"
  >
  <figcaption>
    Attacks generated against our models transferred to other methods, while our models were comparatively insensitive to attacks generated against those methods.
  </figcaption>
</figure>

One interpretation is that a model focused on nuclear structure has fewer useful superficial cues for an attack to exploit. This is consistent with the results, although the experiment alone does not prove the mechanism.

## Did the model really focus on nuclei?

We used several ablations to test whether the method had changed what the model relied on:

- When we removed the non-nuclear background, performance remained high.
- When we subtracted mask-like features from the image representation, our model suffered the largest drop.
- When nuclei were inpainted away, our model predicted almost no tumour tiles.
- Integrated Gradients highlighted nuclear regions more clearly for our method than for the ordinary augmented baseline.

<figure class="research-figure">
  <img
    src="/assets/images/research/shape-based-feature-learning/saliency-comparison.png"
    alt="A matched comparison of Integrated Gradients maps for the ordinary augmented baseline and the proposed method."
    loading="lazy"
  >
  <figcaption>
    The attribution maps are not proof by themselves, but they agree with the controlled ablations: the proposed model relies much more strongly on nuclear regions. Top: Integrated Gradients maps for ERM (baseline). Bottom: Our method.
  </figcaption>
</figure>

## Limitations

The main experiments study one binary classification problem and use ResNet-50 as the primary architecture. We included a preliminary ViT-Tiny evaluation, but larger transformer studies were outside the scope of the paper. The method also depends on having usable nuclear masks during training, even though it does not need them at inference time.

The claim should therefore remain scoped: nuclear masks were highly informative for the cancer-classification tasks and datasets studied here. Other histopathology tasks may depend more heavily on tissue morphology or non-nuclear context.

## Want the behind-the-scenes story?

Academic papers only tell half the story. If you want to read about the messy reality of how this research actually came together—including the failed early experiments with Canny edge detectors, the struggle to stabilise the training loss, and the incredibly lucky misunderstanding that led to our favourite adversarial robustness result—check out the companion blog post:

**[Read the story: What happens when a cancer model can see only cell nuclei?](/2026/07/19/nuclear-masks-and-domain-generalisation.html)**
